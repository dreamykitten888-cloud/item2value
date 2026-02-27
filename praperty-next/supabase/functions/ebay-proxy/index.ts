import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// eBay credentials from Supabase secrets
const EBAY_APP_ID = Deno.env.get('EBAY_APP_ID') || '';
const EBAY_CERT_ID = Deno.env.get('EBAY_CERT_ID') || '';
const AFFILIATE_CAMPAIGN_ID = Deno.env.get('EBAY_AFFILIATE_CAMPAIGN_ID') || '';

// Token cache (in-memory, lasts until function cold starts)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Get OAuth application token (client_credentials grant)
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const credentials = btoa(`${EBAY_APP_ID}:${EBAY_CERT_ID}`);
  const resp = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('OAuth token error:', resp.status, err);
    throw new Error(`OAuth failed: ${resp.status}`);
  }

  const data = await resp.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  console.log('Got new eBay OAuth token, expires in', data.expires_in, 'seconds');
  return cachedToken!;
}

// Search eBay items with full Browse API support
async function searchItems(
  query: string,
  limit: number = 10,
  sort?: string,
  filter?: string,
  fieldgroups?: string
) {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    limit: String(Math.min(limit, 50)),
  });
  if (sort) params.set('sort', sort);
  if (filter) params.set('filter', filter);
  if (fieldgroups) params.set('fieldgroups', fieldgroups);

  const resp = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${AFFILIATE_CAMPAIGN_ID}`,
    },
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Browse API error:', resp.status, err);
    throw new Error(`Browse API failed: ${resp.status}`);
  }

  const data = await resp.json();

  // Transform items to clean format
  const items = (data.itemSummaries || []).map((item: any) => ({
    id: item.itemId,
    title: item.title,
    price: item.price ? { value: parseFloat(item.price.value), currency: item.price.currency } : null,
    image: item.thumbnailImages?.[0]?.imageUrl || item.image?.imageUrl || null,
    condition: item.condition || null,
    conditionId: item.conditionId || null,
    seller: item.seller ? {
      username: item.seller.username,
      feedbackPercent: item.seller.feedbackPercentage,
      feedbackScore: item.seller.feedbackScore
    } : null,
    itemUrl: item.itemAffiliateWebUrl || item.itemWebUrl,
    isAffiliate: !!item.itemAffiliateWebUrl,
    location: item.itemLocation || null,
    shippingCost: item.shippingOptions?.[0]?.shippingCost?.value
      ? parseFloat(item.shippingOptions[0].shippingCost.value)
      : null,
    categories: item.categories?.map((c: any) => ({ id: c.categoryId, name: c.categoryName })) || [],
    buyingOptions: item.buyingOptions || [],
    shortDescription: item.shortDescription || null,
  }));

  // Build response with refinement data when available
  const result: any = {
    total: data.total || 0,
    items,
    query,
  };

  // Include refinement distributions when fieldgroups requested them
  if (data.conditionDistributions) {
    result.conditionDistributions = data.conditionDistributions.map((d: any) => ({
      condition: d.condition,
      conditionId: d.conditionId,
      count: d.matchCount,
      refinementHref: d.refinementHref,
    }));
  }

  if (data.categoryDistributions) {
    result.categoryDistributions = data.categoryDistributions.map((d: any) => ({
      categoryId: d.categoryId,
      categoryName: d.categoryName,
      count: d.matchCount,
      refinementHref: d.refinementHref,
    }));
  }

  if (data.aspectDistributions) {
    result.aspectDistributions = data.aspectDistributions.map((d: any) => ({
      localizedAspectName: d.localizedAspectName,
      aspectValues: (d.aspectValueDistributions || []).slice(0, 10).map((v: any) => ({
        value: v.localizedAspectValue,
        count: v.matchCount,
        refinementHref: v.refinementHref,
      })),
    }));
  }

  if (data.buyingOptionDistributions) {
    result.buyingOptionDistributions = data.buyingOptionDistributions.map((d: any) => ({
      buyingOption: d.buyingOption,
      count: d.matchCount,
      refinementHref: d.refinementHref,
    }));
  }

  if (data.dominantCategoryId) {
    result.dominantCategoryId = data.dominantCategoryId;
  }

  return result;
}

Deno.serve(async (req: Request) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    if (!EBAY_APP_ID || !EBAY_CERT_ID) {
      return new Response(
        JSON.stringify({ error: 'eBay credentials not configured' }),
        { status: 500, headers }
      );
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sort = url.searchParams.get('sort') || undefined;
    const filter = url.searchParams.get('filter') || undefined;
    const fieldgroups = url.searchParams.get('fieldgroups') || undefined;

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: q (search query)' }),
        { status: 400, headers }
      );
    }

    const result = await searchItems(query, limit, sort, filter, fieldgroups);
    return new Response(JSON.stringify(result), { status: 200, headers });

  } catch (err) {
    console.error('ebay-proxy error:', err);
    return new Response(
      JSON.stringify({ error: String(err), message: 'eBay API request failed' }),
      { status: 500, headers }
    );
  }
});
