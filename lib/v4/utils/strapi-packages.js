// Match old Strapi packages to their new names on npm
const toBeDeleted = Symbol();
const toBeRemoved = Symbol();

const strapiPackages = {
  strapi: '@strapi/strapi',
  'strapi-admin': toBeRemoved,
  'strapi-connector-bookshelf': toBeDeleted,
  'strapi-database': toBeRemoved,
  'strapi-generate': toBeRemoved,
  'strapi-generate-api': toBeRemoved,
  'strapi-generate-controller': toBeRemoved,
  'strapi-generate-model': toBeRemoved,
  'strapi-generate-new': toBeRemoved,
  'strapi-generate-plugin': toBeRemoved,
  'strapi-generate-policy': toBeRemoved,
  'strapi-generate-service': toBeRemoved,
  'strapi-helper-plugin': '@strapi/helper-plugin',
  'strapi-hook-ejs': toBeDeleted,
  'strapi-hook-redis': toBeDeleted,
  'strapi-middleware-views': toBeDeleted,
  'strapi-plugin-content-manager': toBeRemoved,
  'strapi-plugin-content-type-builder': toBeRemoved,
  'strapi-plugin-documentation': '@strapi/plugin-documentation',
  'strapi-plugin-email': toBeRemoved,
  'strapi-plugin-graphql': '@strapi/plugin-graphql',
  'strapi-plugin-i18n': '@strapi/plugin-i18n',
  'strapi-plugin-sentry': '@strapi/plugin-sentry',
  'strapi-plugin-upload': toBeRemoved,
  'strapi-plugin-users-permissions': '@strapi/plugin-users-permissions',
  'strapi-provider-amazon-ses': '@strapi/provider-email-amazon-ses',
  'strapi-provider-email-mailgun': '@strapi/provider-email-mailgun',
  'strapi-provider-email-nodemailer': '@strapi/provider-email-nodemailer',
  'strapi-provider-email-sendgrid': '@strapi/provider-email-sendgrid',
  'strapi-provider-email-sendmail': toBeRemoved,
  'strapi-provider-upload-aws-s3': '@strapi/provider-upload-aws-s3',
  'strapi-provider-upload-cloudinary': '@strapi/provider-upload-cloudinary',
  'strapi-provider-upload-local': toBeRemoved,
  'strapi-provider-upload-rackspace': toBeDeleted,
  'strapi-utils': toBeRemoved,
};

module.exports = { strapiPackages, toBeDeleted, toBeRemoved };
