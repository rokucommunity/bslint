import defaultConfig from './config.default';
import { Config } from './configTypes';

let localConfig: Config;

async function loadConfig() {
    let config;
    try {
        const module = await import('./config.local');
        config = module.default;
    } catch (error) {
        config = {};
    }
    return config;
}

loadConfig().then(config => {
    localConfig = config;
}).catch(() => {
    console.error('Local configuration file is not defined, using default config');
    localConfig = {} as Config;
});

const config: Config = { ...defaultConfig, ...localConfig };
export default config;
