ember-cli-prebuild-addon
==============================================================================

Prebuilds your addon and stores it in a specific location inside addon so when your addon is being imported in an app, it need not have to be built again while building the app.  

Installation
------------------------------------------------------------------------------

```
ember install ember-cli-prebuild-addon
```


Usage
------------------------------------------------------------------------------
Using prebuild-addon is fairly straightforward. However, the addon has to provide details about what addon trees can be prebuilt. For instance, it could be `addon`, `templates`, `addon-test-support` etc.
Generally the trees that will not be modified dynamically during build are safe to be prebuilt.  

ember prebuild --trees=addon,templates

The trees to be prebuilt can be passed either from command line option 'trees' or it can be specified in package.json

 "prebuildTrees" : ["addon", "templates" ,"addon-test-support"]



Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd ember-cli-prebuild-addon`
* `npm install`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `npm test` – Runs `ember try:each` to test your addon against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
