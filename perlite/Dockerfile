FROM php:fpm-alpine

LABEL maintainer="sec77 https://github.com/secure-77/Perlite"

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/perlite/
COPY ./index.php ./
COPY ./helper.php ./
COPY ./content.php ./
# local-patch: 烘入静态 settings.php（本 app 的 settings 不读 env，配置静态化，Mac/NUC 同源）。
COPY ./settings.php ./
COPY ./*.svg ./
COPY ./*.ico ./
COPY ./.styles/ ./.styles/
COPY ./.js/ ./.js/
COPY ./.src/ ./.src/
COPY ./vendor/ ./vendor/

VOLUME /var/www/perlite/

EXPOSE 9000
