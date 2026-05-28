import { generarLlaveEnvio, obtenerDelCache, guardarEnCache } from '../utils/cache.js';

const TOKEN_URL = 'https://onlinetools.ups.com/security/v1/oauth/token';
const RATE_URL = 'https://onlinetools.ups.com/api/rating/v2409/Shop';
const ORIGEN_DEFAULT = { city: 'Curitiba', state: 'PR', zip: '80000-000', country: 'BR' };

function crearGestorToken(clientId, clientSecret) {
  let tokenData = null;
  const BASIC = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  async function obtenerToken() {
    if (tokenData && Date.now() < tokenData.expiresAt - 300000) {
      return tokenData.token;
    }
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${BASIC}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`UPS auth error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    tokenData = {
      token: data.access_token,
      expiresAt: Date.now() + (parseInt(data.expires_in) * 1000)
    };
    return data.access_token;
  }

  return { obtenerToken };
}

export function crearUps(config) {
  const cuentas = config.cuentas || [];
  const origen = config.origen || ORIGEN_DEFAULT;
  const gestores = {};
  for (const c of cuentas) {
    gestores[c.account] = crearGestorToken(c.clientId, c.clientSecret);
  }

  function elegirCuenta(paisDestino) {
    const pd = (paisDestino || '').toUpperCase();
    if (pd === 'VE') {
      return cuentas.find(c => c.account === 'B68686') || cuentas[cuentas.length - 1] || cuentas[0];
    }
    return cuentas.find(c => c.account === 'EW0793') || cuentas[0];
  }

  return {
    async cotizar({ address_from, address_to, parcels }) {
      const paisDestino = (address_to.country || '').toUpperCase();
      const cuenta = elegirCuenta(paisDestino);
      if (!cuenta) throw new Error('No hay cuenta UPS disponible para ' + paisDestino);

      const gestor = gestores[cuenta.account];
      const token = await gestor.obtenerToken();

      const cacheKey = JSON.stringify({
        account: cuenta.account,
        from: {
          country: address_from.country,
          zip: address_from.zip || '',
          city: address_from.city || '',
          state: address_from.state || ''
        },
        to: {
          country: address_to.country,
          zip: address_to.zip || '',
          city: address_to.city || '',
          state: address_to.state || ''
        },
        parcels
      });

      const cacheado = await obtenerDelCache(cacheKey);
      if (cacheado) {
        console.log('[ups] cache HIT →', cuenta.account, paisDestino);
        return cacheado;
      }
      console.log('[ups] cache MISS → consultando', cuenta.account, paisDestino);

      const shipperAddr = {
        City: address_from.city || origen.city,
        CountryCode: address_from.country || origen.country
      };
      if (address_from.zip || origen.zip) shipperAddr.PostalCode = address_from.zip || origen.zip;
      if (address_from.state || origen.state) shipperAddr.StateProvinceCode = address_from.state || origen.state;

      const shipToAddr = { CountryCode: address_to.country || paisDestino };
      if (address_to.zip) shipToAddr.PostalCode = address_to.zip;
      if (address_to.city) shipToAddr.City = address_to.city;
      if (address_to.state) shipToAddr.StateProvinceCode = address_to.state;

      const nParcels = (parcels || []).filter(Boolean);
      const pesoTotal = nParcels.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0);
      const first = nParcels[0] || {};

      const pkg = { PackagingType: { Code: '02' } };
      if (first.length && first.width && first.height) {
        pkg.Dimensions = {
          UnitOfMeasurement: { Code: 'CM' },
          Length: String(first.length),
          Width: String(first.width),
          Height: String(first.height)
        };
      }
      pkg.PackageWeight = {
        UnitOfMeasurement: { Code: 'KGS' },
        Weight: String(pesoTotal || parseFloat(first.weight) || 1)
      };

      const rateBody = {
        RateRequest: {
          Request: { RequestOption: 'Shop' },
          Shipment: {
            Shipper: {
              Name: 'Praia Envíos',
              Address: shipperAddr,
              ShipperNumber: cuenta.account
            },
            ShipTo: { Address: shipToAddr },
            Package: pkg,
            PaymentInformation: {
              ShipmentCharge: {
                Type: '01',
                BillShipper: { AccountNumber: cuenta.account }
              }
            }
          }
        }
      };

      const res = await fetch(RATE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rateBody)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('[ups] error', res.status, JSON.stringify(data));
        const msg = data.errors?.[0]?.message || data.error_description || `UPS error ${res.status}`;
        throw new Error(msg);
      }

      const shipments = data.RateResponse?.RatedShipment || [];
      const arr = Array.isArray(shipments) ? shipments : [shipments];

      const rates = arr.filter(Boolean).map(r => {
        const dias = r.GuaranteedDelivery?.BusinessDaysInTransit
          ? parseInt(r.GuaranteedDelivery.BusinessDaysInTransit) : null;
        return {
          provider: 'UPS',
          service: r.Service?.Description || r.Service?.Code || 'UPS',
          amount: r.TotalCharges?.MonetaryValue || '0',
          currency: r.TotalCharges?.CurrencyCode || 'USD',
          days: dias,
          duration: dias ? `${dias} días` : '',
          account: cuenta.account
        };
      });

      const resultado = { status: 'success', rates };
      await guardarEnCache(cacheKey, resultado);
      console.log('[ups]', rates.length, 'tarifas obtenidas');
      return resultado;
    }
  };
}
