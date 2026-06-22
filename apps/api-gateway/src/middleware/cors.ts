export function corsHeaders(origin:string | null): Record<string,string> {
    const allowedOrigin = (process.env.PLATFORM_URL || 'http://localhost:3001').split(',');
    const origin_ = origin &&  allowedOrigin.includes(origin) ? origin  : allowedOrigin[0]!
    return {
        'Access-Control-Allow-Origin': origin_,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
};

export function handleCors(request:Request): Response| null{
    if(request.method != "OPTIONS") return null;
    const origin  = request.headers.get('Origin');
    return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
    });
};