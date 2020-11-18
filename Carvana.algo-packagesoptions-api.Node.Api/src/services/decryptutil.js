const Promise = require('bluebird');
const fs = require('fs');
const NodeRSA = require('node-rsa');
const certFilePath = '/secrets/internal-encryption-certificate/cert-private.pem';
const CarvanaDecryptUtil = require('@carvana/node-decrypt');

// for local dev without docker use dev path to cert
// const certFilePath = '/Users/brandonculley/code/secrets/cert-private.pem';

export class DecryptWrapper {

  constructor(azureConfig) {
    this._azureConfig = {
      inputs: azureConfig.inputs
    };
    this.init = this.init.bind(this);
    this.decryptUtility = new CarvanaDecryptUtil(certFilePath);
  }

  init(){
        const prms = new Promise(resolve => {
      fs.readFile(certFilePath, (err, keyData) => {
        this._key=keyData;
        resolve(keyData);
      });

    });
    return prms;
  }

  async decryptHelloWorld() {
    const {
      inputs: { hello_world }
    } = this._azureConfig;

    try {

      const testDecrypt = this.decrypt(hello_world).then(buffer => buffer.toString('utf-8'))
      return testDecrypt;
    } catch (error) {
      throw new Error(error);
    }
  }



  async decryptAzureClientSecret() {
    const {
      inputs: { azureClientSecret }
    } = this._azureConfig;

    try {
      return this.decrypt(azureClientSecret).then(buffer =>
        buffer.toString('utf-8')
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  async decryptIdentityServerScopeSecret() {
    const {
      inputs: { identityServerScopeSecret }
    } = this._azureConfig;

    try {
      return this.decrypt(identityServerScopeSecret).then(buffer =>
        buffer.toString('utf-8')
      );
    } catch (error) {
      throw new Error(error);
    }
  }


  async decrypt(source) {
      try {
        const plainTxt= this.decryptUtility.decrypt(source);
        return plainTxt;
      } catch (error) {
    throw new Error(error);
      }
  }
}
