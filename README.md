# The Seed

A refined version of the front-end code used at PKU Helper.

**Note that this repository does not belong to any website. Developers of this repository take no responsibility of contents on websites using it.**

 We do not provide any kind of tech support. Use at your own risk.

## Installation

A corresponding backend server is required to host APIs for the front-end code.
Visit [jimmielin/the-light](https://github.com/jimmielin/the-light) for setup instructions for backend server.

Install `nodejs` and run `npm install` to install requirements.

As a normal Create-React-App project, run `npm start` to start local dev server,
and run `npm run build` to build production HTML files into `build` directory.

You may need to run `git submodule init && git submodule update --remote` if submodule is not cloned.

## Customization and Configuration

All branding information (e.g. website title, API domain, slogan) has been removed, and it is up to you to customize them.

Those customizable variables start with `_BRAND` in their name.
You can search for `_BRAND_` in `src` and `public` directory and replace all occurrences to the value you want.

Moreover, `index.html` includes these vital parameters that you would mostly like to change:

- `__WEBHOLE_HAPI_DOMAIN`: hole backend API domain, e.g. `https://hapi.your_domain.com`
- `__WEBHOLE_GATEWAY_DOMAIN`: gateway domain for user management, e.g. `https://gateway.your_domain.com`
- `__WEBHOLE_DEV_SERVER_FLAG`: set to `true` if it is a development environment (will show an alert on the page)
- `__WEBHOLE_DISABLE_WEBP`: set to `true` if hole backend API does not support webp image format

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.zh-cn.html) for more details.
