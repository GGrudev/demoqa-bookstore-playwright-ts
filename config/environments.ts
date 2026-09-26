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
        dialog: number;
        uiSettle: number;
        asyncList: number;
        longTest: number;
    };
}

type EnvironmentBase = {
    baseUrl: string;
    apiBaseUrl: string;
    invalidUser: EnvironmentConfig['credentials']['invalidUser'];
    timeout: EnvironmentConfig['timeout'];
};

const environmentBases: Record<string, EnvironmentBase> = {
    dev: {
        baseUrl: 'https://demoqa.com',
        apiBaseUrl: 'https://demoqa.com',
        invalidUser: {
            userName: 'nonExistentUser',
            password: 'WrongPass123!',
        },
        timeout: {
            default: 30000,
            navigation: 60000,
            action: 10000,
            dialog: 10000,
            uiSettle: 15000,
            asyncList: 20000,
            longTest: 60000,
        },
    },
};

function getStaticValidUser() {
    const userName = process.env.DEMOQA_USERNAME;
    const password = process.env.DEMOQA_PASSWORD;

    if (process.env.CI) {
        if (!userName || !password) {
            throw new Error(
                'CI requires DEMOQA_USERNAME and DEMOQA_PASSWORD repository secrets ' +
                    'for suites that use the static DemoQA user (smoke/e2e/authenticated). ' +
                    'API-only jobs do not need them.'
            );
        }

        return { userName, password };
    }

    return {
        userName: userName || 'jdoe',
        password: password || 'Test123!',
    };
}

function getEnvironmentBase(): EnvironmentBase {
    const env = process.env.ENV || 'dev';
    const config = environmentBases[env];

    if (!config) {
        const availableEnvs = Object.keys(environmentBases).join(', ');
        throw new Error(`Environment '${env}' not found. Available environments: ${availableEnvs}`);
    }

    return config;
}

export function getEnvironment(): EnvironmentConfig {
    const config = getEnvironmentBase();

    // Lazy so API-only CI jobs can load config without UI login secrets.
    return {
        baseUrl: config.baseUrl,
        apiBaseUrl: config.apiBaseUrl,
        timeout: config.timeout,
        get credentials() {
            return {
                validUser: getStaticValidUser(),
                invalidUser: config.invalidUser,
            };
        },
    };
}

export function getBaseUrl(): string {
    return getEnvironmentBase().baseUrl;
}

export function getApiBaseUrl(): string {
    return getEnvironmentBase().apiBaseUrl;
}

export function getValidUserCredentials() {
    return getStaticValidUser();
}

export function getInvalidUserCredentials() {
    return getEnvironmentBase().invalidUser;
}

export function getTimeouts(): EnvironmentConfig['timeout'] {
    return getEnvironmentBase().timeout;
}
