import crypto from 'crypto';


export const JWT_SECRET = process.env.JWT_SECRET || (() => {
    throw new Error('JWT_SECRET environment variable is required');
})();

interface JWTHeader {
    alg: string;
    typ: string;
}

interface JWTPayload {
    sub: Record<string, unknown>;
    iat: number;
}

interface DecodedJWT {
    header: JWTHeader;
    payload: JWTPayload;
}

function verifyJWT(token: string, secret: string): boolean {
    try {
        verifyAndDecodeJWT(token, secret);
        return true;
    } catch (e) {
        console.error('JWT verification failed:', (e as Error).message);
        return false;
    }
}

function verifyAndDecodeJWT(token: string, secret: string): DecodedJWT {
    // Split the JWT into its parts
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
    }
    const [encodedHeader, encodedPayload, signature] = parts;

    // Recreate the signature base
    const signatureBase = `${encodedHeader}.${encodedPayload}`;

    // Recreate the signature using the secret
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signatureBase)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    // Check if the signature matches
    if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
    }

    // Helper to decode base64url
    function base64UrlDecode(str: string): string {
        // Replace - with + and _ with /
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with = to make length a multiple of 4
        while (str.length % 4) {
            str += '=';
        }
        return Buffer.from(str, 'base64').toString('utf8');
    }

    // Decode header and payload
    const header = JSON.parse(base64UrlDecode(encodedHeader)) as JWTHeader;
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

    return { header, payload };
}


// function generateJWT(payload: Record<string, unknown>, secret: string): string {
function generateJWT(userId: number, secret: string): string {
    const header = {
        alg: 'HS256', // HMAC SHA256
        typ: 'JWT'
    };

    let currentTime = Date.now() / 1000;
    let payload = { sub: userId, iat: Math.floor(currentTime), exp: Math.floor(currentTime) + (600) }; // Token valid for 10 minutes

    function base64UrlEncode(obj: Record<string, unknown>): string {
        // Ensure stable key order for JSON serialization
        function stableStringify(o: unknown): string {
            if (o === null || typeof o !== 'object') return JSON.stringify(o);
            if (Array.isArray(o)) return '[' + o.map(stableStringify).join(',') + ']';
            const obj_cast = o as Record<string, unknown>;
            return '{' + Object.keys(obj_cast).sort().map(k => JSON.stringify(k) + ':' + stableStringify(obj_cast[k])).join(',') + '}';
        }
        return Buffer.from(stableStringify(obj))
            .toString('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }
    
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const signatureBase = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
        .createHmac('sha256', secret)
        .update(signatureBase)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${signatureBase}.${signature}`;
}



// function prepareData(): void {
//     let data = { name: "John Doe", age: 30  };
//     let payload = { user: data, iat: Math.floor(Date.now() / 1000) };
//     let secret = "my_secret_key_codam";
//     let token = generateJWT(payload, secret);
//     console.log(token);

//     // Example usage of verifyJWT
//     try {
//         const decoded = verifyJWT(token, secret);
//         console.log('Decoded JWT:', decoded);
//     } catch (e) {
//         console.error('JWT verification failed:', (e as Error).message);
//     }
// }

// prepareData();

export { generateJWT, verifyJWT };