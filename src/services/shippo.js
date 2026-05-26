export function crearShippo(token, baseUrl) {
  const apiUrl = baseUrl || 'https://api.goshippo.com';

  return {
    async cotizar({ address_from, address_to, parcels }) {
      const body = {
        address_from,
        address_to,
        parcels,
        async: false
      };

      console.log('[shippo] request →', JSON.stringify(body));

      const res = await fetch(`${apiUrl}/shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `ShippoToken ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('[shippo] error', res.status, JSON.stringify(data));
        throw new Error(data.detail || data.title || `Shippo error ${res.status}`);
      }

      console.log('[shippo] response → status:', data.status, 'rates:', data.rates?.length || 0);

      return {
        status: data.status,
        rates: (data.rates || []).map(function(r) {
          return {
            provider: r.provider,
            service: r.servicelevel?.name || '',
            amount: r.amount,
            currency: r.currency_local || r.currency || 'USD',
            days: r.estimated_days,
            duration: r.duration_terms || '',
            object_id: r.object_id
          };
        }),
        messages: data.messages || []
      };
    }
  };
}
