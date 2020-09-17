import Promise from 'bluebird';
import { KeyVaultClient, KeyVaultCredentials } from 'azure-keyvault';
import { AuthenticationContext } from 'adal-node';

export class CarvanaKeyVault {
  constructor(keyvaultConfig) {
    this._keyvaultConfig = keyvaultConfig;
    this.tokenCallback = this.tokenCallback.bind(this);
    this.init = this.init.bind(this);
    this.getSecret = this.getSecret.bind(this);

    this._credentials = new KeyVaultCredentials((challenge, callback) => {
      const context = new AuthenticationContext(challenge.authorization);

      const {
        CARVANA_APP_AZURE_CLIENT_ID,
        CARVANA_APP_AZURE_CLIENT_SECRET
      } = keyvaultConfig;
      return context.acquireTokenWithClientCredentials(
        challenge.resource,
        CARVANA_APP_AZURE_CLIENT_ID,
        CARVANA_APP_AZURE_CLIENT_SECRET,
        this.tokenCallback(callback)
      );
    });

  }

  // eslint-disable-next-line class-methods-use-this
  tokenCallback(callback){
    return (err, tokenResponse) => {
      if (err) throw new Error(err);

      const authorizationValue = `${tokenResponse.tokenType} ${
        tokenResponse.accessToken
      }`;

      return callback(null, authorizationValue);
    };
  }

  async init() {
    const prms = new Promise(async resolve => {
      this._client = new KeyVaultClient(this._credentials);
      this.getSecret = this.getSecret.bind(this);

      resolve();
    });

    return prms;
  }

  async getSecret(secret) {
    const {
      CARVANA_APP_KEYVAULT_URL
    } = this._keyvaultConfig;
    const {
      secretName,
      secretVersion
    } = secret;
    try {
      const secretResponse = await this._client.getSecret(CARVANA_APP_KEYVAULT_URL, secretName, secretVersion);
      return secretResponse.value;
    } catch (error) {
      throw new Error(error);
    }
  }
}
