# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.0.2 (2025-11-18)


### Features

* **auth:** adding new option-jwt strategy and guard ([54be8b5](https://github.com/PedroHPeretto/url-shortener-api/commit/54be8b5a2daee7812a7f89dc368dab7ec71c2d8a))
* **auth:** creating register and login endpoints on controller ([3ec0376](https://github.com/PedroHPeretto/url-shortener-api/commit/3ec0376ddd541271ce9e22243688a8d9e8f53456))
* **auth:** implementing auth service with register and login logic ([1d56a20](https://github.com/PedroHPeretto/url-shortener-api/commit/1d56a20f454902b14546d9381612e2a6d0448fcf))
* **auth:** implementing jwt strategy and auth guard ([5607f8b](https://github.com/PedroHPeretto/url-shortener-api/commit/5607f8bda1592e3341a30239074a825c11cdf4e1))
* **ci/cd:** adding cd pipeline to deploy on aws ec2 ([cde90c1](https://github.com/PedroHPeretto/url-shortener-api/commit/cde90c1dc37db9fc28a648a54ba0b22949d294f5))
* **main:** implementing global validation pipes ([827ad29](https://github.com/PedroHPeretto/url-shortener-api/commit/827ad29e80b139d116906fc1a5a3cf0cffbc069e))
* **swagger:** seting up swagger (openapi) documentation ([cd69b86](https://github.com/PedroHPeretto/url-shortener-api/commit/cd69b8608e1520ebb55ed95700757acc50543999))
* **urls:** creating authorized urls endpoints ([fdebda8](https://github.com/PedroHPeretto/url-shortener-api/commit/fdebda86bbde8a3fce5d9035ac0959e79818b373))
* **urls:** creating first public urls endpoints ([bbd04e7](https://github.com/PedroHPeretto/url-shortener-api/commit/bbd04e776187b83370b01b0b43ac0506696f9744))
* **users:** creating users endpoints on controller ([0517866](https://github.com/PedroHPeretto/url-shortener-api/commit/05178669fd7788857f6cbf35e381de084bea4642))


### Bug Fixes

* **app:** enable ssl for database connection ([7cae1da](https://github.com/PedroHPeretto/url-shortener-api/commit/7cae1daccdc0ffc1e4b2b0702403372dcaa9c681))
* **auth, docker:** fixing linting issues ([d832dac](https://github.com/PedroHPeretto/url-shortener-api/commit/d832dac65699fafb711eb163830abdaa2ccebea1))
* **auth:** adjusting GetUser decorator and Guards behavior on user request ([a6beb86](https://github.com/PedroHPeretto/url-shortener-api/commit/a6beb8606e83311759543b76ef289a13816c01e1))
* **auth:** fixing linting error - unused var password ([049bb2a](https://github.com/PedroHPeretto/url-shortener-api/commit/049bb2a0a6c9557b906159b4e773ecf07d39149f))
* **auth:** fixing unawaited return of async function jwt.sign ([8011cb7](https://github.com/PedroHPeretto/url-shortener-api/commit/8011cb74538f767d94a51e68dbc9b434ed1a919d))
* **docker:** fixing Dockerfile and docker-compose typing mistake ([c346b20](https://github.com/PedroHPeretto/url-shortener-api/commit/c346b206a32987ef328b9a3c93ce09d8c3618203))
* **docker:** fixing path to main.js ([3c9c520](https://github.com/PedroHPeretto/url-shortener-api/commit/3c9c520bf0ec720a2eeade86b03e39f38c216ce6))
* **docker:** setting container to production mode ([e3ef1a9](https://github.com/PedroHPeretto/url-shortener-api/commit/e3ef1a908fcd87a71b75a487074ce1960f4990a1))
* **docker:** setting variable node env ([d9f8176](https://github.com/PedroHPeretto/url-shortener-api/commit/d9f8176d7ceb470b2ff513198d6f785c1cef2ab3))
* **eslint:** fixing eslint config for _variables ([6412084](https://github.com/PedroHPeretto/url-shortener-api/commit/641208481a04542a915cc789ae232dd40a306f6e))
* **hooks:** fixing commitlint and husky commands for pre-commit and commit-msg ([4a5f559](https://github.com/PedroHPeretto/url-shortener-api/commit/4a5f559f47d1fcb040a92d2048f0b5aa02e7fd5d))
* **urls:** changing base url into a env variable and adding protocol verification pipe ([17b8e92](https://github.com/PedroHPeretto/url-shortener-api/commit/17b8e923e9691a2db3c633d4ed0a95c5207eed89))
* **urls:** fixing redirect endpoint api response ([8fcebdc](https://github.com/PedroHPeretto/url-shortener-api/commit/8fcebdc866c3ba567138b58be0e87a0e2ea3ca84))
* **urls:** fixing url entity column deleted_at type to Date or null ([203b571](https://github.com/PedroHPeretto/url-shortener-api/commit/203b571cadf755713f26d1e2a151733fab07ee9a))
* **urls:** fixing url for getUserLinks endpoint ([da53d8f](https://github.com/PedroHPeretto/url-shortener-api/commit/da53d8f4a496d1b1d1e4775c5bcf45b3c157abe0))
* **urls:** fixing urls service functions logic ([3595354](https://github.com/PedroHPeretto/url-shortener-api/commit/35953542bcf4bf3115251995a85c7a9677e9bade))
* **users:** adding password column to table users ([151443d](https://github.com/PedroHPeretto/url-shortener-api/commit/151443dc23c40eb8546a2d4ceeac7e40a061f969))
* **users:** fixing auth guard usage on users controller ([d5f9fbb](https://github.com/PedroHPeretto/url-shortener-api/commit/d5f9fbb1a352fc285bd593d5de921a865194f7b7))
* **users:** fixing column deleted_at to accept type null ([2c0bd9f](https://github.com/PedroHPeretto/url-shortener-api/commit/2c0bd9fee497a172fe60b80139a092e70d8dbdcc))
* **users:** fixing unhashed password on service function update user ([3b280b3](https://github.com/PedroHPeretto/url-shortener-api/commit/3b280b3c57a8945f94cb6f2584a50b6717afac81))
* **users:** removing unused endpoint create users ([e81fe2f](https://github.com/PedroHPeretto/url-shortener-api/commit/e81fe2f8be5d36be186ccba41a5c7208b4bf9a8e))
