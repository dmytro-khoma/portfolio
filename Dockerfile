# Production image: PHP 8.4 with Apache, document root = public/.
# Apache serves static files with HTTP Range support and reads public/.htaccess.

FROM php:8.4-apache

# Production PHP settings (no error output to visitors, no X-Powered-By).
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf "expose_php = Off\n" > "$PHP_INI_DIR/conf.d/portfolio.ini"

# Modules used by public/.htaccess.
RUN a2enmod headers expires deflate rewrite

# Serve public/ only; src/, data/ and storage/ stay outside the web root.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri "s!/var/www/html!${APACHE_DOCUMENT_ROOT}!g" /etc/apache2/sites-available/*.conf \
    && printf '<Directory /var/www/html/public>\n    AllowOverride All\n    Require all granted\n</Directory>\nServerTokens Prod\nServerSignature Off\n' \
       > /etc/apache2/conf-available/portfolio.conf \
    && a2enconf portfolio

# Hosting platforms pass the port in $PORT; default to 80 locally.
ENV PORT=80
RUN sed -ri 's/^Listen 80$/Listen ${PORT}/' /etc/apache2/ports.conf \
    && sed -ri 's/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/' /etc/apache2/sites-available/000-default.conf

COPY . /var/www/html
RUN mkdir -p /var/www/html/storage && chown -R www-data:www-data /var/www/html/storage

EXPOSE 80
