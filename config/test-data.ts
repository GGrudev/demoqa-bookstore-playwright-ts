import { getValidUserCredentials, getInvalidUserCredentials } from './environments';

export interface UserCredentials {
    userName: string;
    password: string;
}

export interface RegistrationData {
    firstName: string;
    lastName: string;
    userName: string;
    password: string;
}

export interface BookData {
    isbn: string;
    title: string;
    subTitle: string;
    author: string;
    publisher: string;
    totalPages: number;
    description: string;
    website: string;
}

export class TestDataBuilder {
    private static generateRandomString(length: number = 8): string {
        return Math.random()
            .toString(36)
            .substring(2, length + 2);
    }

    private static generateUniqueUserName(): string {
        const timestamp = Date.now();
        return `testUser_${timestamp}_${this.generateRandomString(5)}`;
    }

    private static generateStrongPassword(): string {
        return `Test@${this.generateRandomString(6)}1!`;
    }

    static createValidUser(overrides?: Partial<UserCredentials>): UserCredentials {
        const envCredentials = getValidUserCredentials();
        return {
            userName: overrides?.userName || envCredentials.userName,
            password: overrides?.password || envCredentials.password,
        };
    }

    static createInvalidUser(overrides?: Partial<UserCredentials>): UserCredentials {
        const envCredentials = getInvalidUserCredentials();
        return {
            userName: overrides?.userName || envCredentials.userName,
            password: overrides?.password || envCredentials.password,
        };
    }

    static createRandomUser(overrides?: Partial<RegistrationData>): RegistrationData {
        return {
            firstName: overrides?.firstName || 'Test',
            lastName: overrides?.lastName || 'User',
            userName: overrides?.userName || this.generateUniqueUserName(),
            password: overrides?.password || this.generateStrongPassword(),
        };
    }

    static readonly gitPocketGuide: BookData = {
        isbn: '9781449325862',
        title: 'Git Pocket Guide',
        subTitle: 'A Working Introduction',
        author: 'Richard E. Silverman',
        publisher: "O'Reilly Media",
        totalPages: 234,
        description:
            'This pocket guide is the perfect on-the-job companion to Git, the distributed version control system.',
        website: 'http://chimera.labs.oreilly.com/books/1230000000561/index.html',
    };

    static readonly learningJavaScript: BookData = {
        isbn: '9781449331818',
        title: 'Learning JavaScript Design Patterns',
        subTitle: "A JavaScript and jQuery Developer's Guide",
        author: 'Addy Osmani',
        publisher: "O'Reilly Media",
        totalPages: 254,
        description:
            "With Learning JavaScript Design Patterns, you'll learn how to write beautiful, structured, and maintainable JavaScript.",
        website: 'http://www.addyosmani.com/resources/essentialjsdesignpatterns/book/',
    };

    static readonly designingEvolvableWebApis: BookData = {
        isbn: '9781449337711',
        title: 'Designing Evolvable Web APIs with ASP.NET',
        subTitle: 'Harnessing the Power of the Web',
        author: 'Glenn Block et al.',
        publisher: "O'Reilly Media",
        totalPages: 538,
        description: 'Design and build Web APIs for a broad range of clients.',
        website: 'http://chimera.labs.oreilly.com/books/1234000001708/index.html',
    };

    static readonly youDontKnowJs: BookData = {
        isbn: '9781491904244',
        title: "You Don't Know JS",
        subTitle: 'ES6 & Beyond',
        author: 'Kyle Simpson',
        publisher: "O'Reilly Media",
        totalPages: 278,
        description:
            'No matter how much experience you have with JavaScript, odds are you don\u2019t fully understand the language.',
        website: 'https://github.com/getify/You-Dont-Know-JS/tree/master/es6%20&%20beyond',
    };

    static readonly eloquentJavaScript: BookData = {
        isbn: '9781593275846',
        title: 'Eloquent JavaScript, Second Edition',
        subTitle: 'A Modern Introduction to Programming',
        author: 'Marijn Haverbeke',
        publisher: 'No Starch Press',
        totalPages: 472,
        description: 'JavaScript lies at the heart of almost every modern web application.',
        website: 'http://eloquentjavascript.net/',
    };

    static readonly understandingEcmaScript6: BookData = {
        isbn: '9781593277574',
        title: 'Understanding ECMAScript 6',
        subTitle: 'The Definitive Guide for JavaScript Developers',
        author: 'Nicholas C. Zakas',
        publisher: 'No Starch Press',
        totalPages: 352,
        description: 'ECMAScript 6 represents the biggest update to the core of JavaScript.',
        website: 'https://leanpub.com/understandinges6/read',
    };

    static getKnownBooks(): BookData[] {
        return [
            this.gitPocketGuide,
            this.learningJavaScript,
            this.designingEvolvableWebApis,
            this.youDontKnowJs,
            this.eloquentJavaScript,
            this.understandingEcmaScript6,
        ];
    }

    static getBookByIsbn(isbn: string): BookData | undefined {
        return this.getKnownBooks().find((book) => book.isbn === isbn);
    }
}
