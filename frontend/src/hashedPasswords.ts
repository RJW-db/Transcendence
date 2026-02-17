import argon2 from 'argon2';
import * as readline from 'readline';

async function hashPassword(password: string): Promise<string> {
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

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise<string>(resolve => rl.question(query, (answer: string) => {
        rl.close();
        resolve(answer);
    }));
}

async function main() {
    const password1 = await askQuestion('Enter password to hash: ');
    const hash = await hashPassword(password1);
    console.log('Hashed password:', hash);

    const password2 = await askQuestion('Enter password to verify: ');
    const isMatch = await verifyPassword(hash, password2);
    console.log(isMatch ? '✓ Passwords match!' : '✗ Passwords do not match');
}

main();