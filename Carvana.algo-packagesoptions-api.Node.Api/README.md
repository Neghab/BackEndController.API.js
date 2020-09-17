# Build tools

### Environment variables
We have different settings for each env. If you need to access any of those vars, you can do so by doing the following: `process.env.VAR_NAME`. If `VAR_NAME` exists in the env for the current env you are running in, it will replace it with the value.
If you want env variables to be replaced in index.html, you will have to use the following naming convention `%VAR_NAME%`
After adding a variable to the env file, you will need to restart webpack for the new variables to be correctly injected.
It will look for the following env file names:
  .env.local
  .env.ENVIRONMENT.local
  .env.ENVIRONMENT
  .env

### NPM Scripts
The following npm scripts are available:
  - `start`: Starts webpack dev server with `NODE_ENV=development`,
  - `start:dev|test|uat|prod`: Builds the project with env.
  - `build:dev|test|uat|prod`: Builds the project with env.
  - `build:analyze`: Builds the project with prod env, and opens browser with graph of all files that are being imported (useful to see what libs are being bundled).
  - `test`: Runs Jest.
  - `test:watch`: Runs Jest in watch mode.
  - `coverage`: Runs Jest and also produces a test coverage percentage.
  - `prettier`: Runs prettier format against all files inside of src/ directory. This will modify all files to conform with prettier rules.
  - `lint`: Runs eslint against all files inside of src/ directory.
  - `sonar_lint`: Runs eslint with sonarqube against all files inside of src/ directory, and outputs a linting-results.json file.

### Webpack Requirements
The webpack configuration requires the following:
  - An environment variable of `CVNA_APP_PUBLIC_URL` or `CARVANA_APP_PUBLIC_URL` set to the app name.
  - A key `homepage` in package.json set to the app name.
  - A `src` folder containing an `index.js` or `index.ts`.
  - At least one `.env` file.

### Jest Requirements
The jest configuration requires the following:
 - A test setup file at `src/setupTests.js`.
 - Enzyme version 3.4.0 or higher (if using Enzyme).

### Jest Debug
When installing jest, it will also add a .vscode/launch.json which will allow you to launch the vscode debugger and attach it to jest so you can debug.

### Local Decryption Requirements
The following set up is required for decrypting encrypted values in settings and config files, etc.

1. For node apps, a PEM certificate is required for decrypting encrypted values

2. PEM certificates are derived from PFX certificates

3. At the time of this writing, the internal certificate used for development is found at X:\Engineering\Secured\Common\Certs - Development\Crypto Certs\internal.carvana.com.pfx

4. The PFX cert is converted to a PEM cert using the OpenSSL CLI tool following these steps:
    #####Conversion to a combined PEM file:
    - To convert a PFX file to a PEM file that contains both the certificate and private key, the following command needs to be used:

        `openssl pkcs12 -in internal.carvana.com.pfx -out <desired_cert_name>.pem -nodes`

    #####Conversion to separate PEM files
    - We can extract the private key form a PFX to a PEM file with this command:

    `openssl pkcs12 -in internal.carvana.com.pfx -nocerts -out key.pem`

    - Exporting the certificate only:

    `openssl pkcs12 -in internal.carvana.com.pfx -clcerts -nokeys -out cert.pem`

    - Removing the password from the extracted private key:

    `openssl rsa -in key.pem -out server.key`

    (taken from https://www.xolphin.com/support/Certificate_conversions/Convert_pfx_file_to_pem_file)
5. Move the created certificate to the correct location locally, as per where your code expects to find the cert file.


### Running in docker
This assumes that you have docker installed on your machine and can run docker CLI

1. cd to folder where Dockerfile is located, generally root of your project

2. Build docker image: docker build -t <name_of_image>:<version> .
e.g docker build -t myproject:v1 .
For more info on docker build please refer to documentation here - https://docs.docker.com/engine/reference/commandline/build/

3. Once docker image is successfully built, run docker image to test the application:
docker run -p <hostPort:containerPort> <name_of_image>:<version>
For more info on docker run please refer to documentation here - https://docs.docker.com/engine/reference/run/

4. To test the application use browser OR curl OR postman: http://localhost:<hostPort>/path



## Example: How to build and run docker and map secrets volume

```shell
docker build -t packagesoptionsapi:v1 .

docker run --rm -v /Users/brandonculley/code/Carvana.AlgoContent/Carvana.AlgoContent.PackagesOptionsAPI/Carvana.algo-packagesoptions-api.Node.Api/Deployments/carvana-seo-algo-packagesoptions-api:/Deployments/carvana-seo-algo-packagesoptions-api -v /Users/brandonculley/code/secrets:/secrets/internal-encryption-certificate/ -p 4000:4000 packagesoptionsapi:v1

http://localhost:4000/api/packagesoptions?make=toyota&model=sienna&year=2014
http://localhost:4000/api/hello
http://localhost:4000/api/secure2
http://localhost:4000/api/v1/liveness
http://localhost:4000/api/v1/readiness
```
