import argon2 from 'argon2';


export async function hashPassword(password: string): Promise<string> {
    try {
        const hash = await argon2.hash(password, {
            type: argon2.argon2id,
            timeCost: 2,
            memoryCost: 65536,
            parallelism: 1,
            hashLength: 32
        });
        return hash;
    } catch (error) {
        console.error('Hashing failed:', error);
        throw error;
    }
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch (error) {
        console.error('Verification failed:', error);
        throw error;
    }
}