const appConfig = require('./app.json').expo;

const githubRepository = process.env.GITHUB_REPOSITORY?.split('/').pop();
const inferredBaseUrl = githubRepository && !githubRepository.endsWith('.github.io')
  ? `/${githubRepository}`
  : '';
const baseUrl = process.env.GITHUB_PAGES_BASE_PATH ?? inferredBaseUrl;

module.exports = {
  ...appConfig,
  experiments: {
    ...appConfig.experiments,
    baseUrl,
  },
};
