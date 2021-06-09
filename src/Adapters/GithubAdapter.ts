import { AdapterMethodSandbox } from '../Models/Classes';
import GithubSearchData from '../Models/Classes/AdapterDataClasses/GithubSearchData';
import { IGithubAdapter } from '../Models/Constants/Interfaces';

export default class GithubAdapter implements IGithubAdapter {
    async searchStringInRepo(queryString: string) {
        const adapterSandbox = new AdapterMethodSandbox();

        return await adapterSandbox.safelyFetchData(async () => {
            const res = await fetch(
                `https://api.github.com/search/code?q=` + queryString
            );
            const rateLimitRemaining = Number(
                res.headers.get('x-ratelimit-remaining')
            );
            const rateLimitReset = Number(res.headers.get('x-ratelimit-reset'));
            const json = await res.json();
            return new GithubSearchData({
                ...json,
                rateLimitRemaining,
                rateLimitReset
            });
        });
    }
}
