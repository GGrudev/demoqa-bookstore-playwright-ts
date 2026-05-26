export interface EnvironmentConfig {
    baseUrl: string;
    apiBaseUrl: string;
    credentials: {
        validUser: {
            userName: string;
            password: string;
        };
        invalidUser: {
            userName: string;
            password: string;
        };
    };
    timeout: {
        default: number;
        navigation: number;
        action: number;
    };
}

export const environments: Record<string, EnvironmentConfig> = {
    dev: {
        baseUrl: 'https://demoqa.com',
        apiBaseUrl: 'https://demoqa.com',
        credentials: {
            validUser: {
                userName: process.env.DEMOQA_USERNAME || 'jdoe',
                password: process.env.DEMOQA_PASSWORD || 'Test123!',
            },
            invalidUser: {
                userName: 'nonExistentUser',
                password: 'WrongPass123!',
            },
        },
        timeout: {
            default: 30000,
            navigation: 60000,
            action: 10000,
        },
    },
};

export function getEnvironment(): EnvironmentConfig {
    const env = process.env.ENV || 'dev';
    const config = environments[env];

    if (!config) {
        const availableEnvs = Object.keys(environments).join(', ');
        throw new Error(`Environment '${env}' not found. Available environments: ${availableEnvs}`);
    }

    return config;
}

export function getBaseUrl(): string {
    return getEnvironment().baseUrl;
}

export function getApiBaseUrl(): string {
    return getEnvironment().apiBaseUrl;
}

export function getValidUserCredentials() {
    return getEnvironment().credentials.validUser;
}

export function getInvalidUserCredentials() {
    return getEnvironment().credentials.invalidUser;
}
