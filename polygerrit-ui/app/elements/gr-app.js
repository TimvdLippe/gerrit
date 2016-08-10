// Copyright (C) 2016 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
(function() {
  'use strict';

  Polymer({
    is: 'gr-app',

    /**
     * Fired when the URL location changes.
     *
     * @event location-change
     */

    properties: {
      params: Object,
      keyEventTarget: {
        type: Object,
        value: function() { return document.body; },
      },

      _account: {
        type: Object,
        observer: '_accountChanged',
      },
      _serverConfig: Object,
      _version: String,
      _viewState: Object,
      _lastError: Object,
    },

    listeners: {
      'page-error': '_handlePageError',
      'title-change': '_handleTitleChange',
    },

    observers: [
      '_loadPlugins(_serverConfig.plugin.js_resource_paths)',
    ],

    behaviors: [
      Gerrit.KeyboardShortcutBehavior,
    ],

    attached: function() {
      this.$.restAPI.getAccount().then(function(account) {
        this._account = account;
      }.bind(this));
      this.$.restAPI.getConfig().then(function(config) {
        this._serverConfig = config;
      }.bind(this));
      this.$.restAPI.getVersion().then(function(version) {
        this._version = version;
      }.bind(this));
    },

    ready: function() {
      this.$.reporting.appStarted();
      this._viewState = {
        changeView: {
          changeNum: null,
          patchRange: null,
          selectedFileIndex: 0,
          showReplyDialog: false,
          diffMode: null,
        },
        changeListView: {
          query: null,
          offset: 0,
          selectedChangeIndex: 0,
        },
        dashboardView: {
          selectedChangeIndex: 0,
        },
      };
    },

    _accountChanged: function(account) {
      // Preferences are cached when a user is logged in; warm them.
      this.$.restAPI.getPreferences();
      this.$.restAPI.getDiffPreferences();
    },

    _loadPlugins: function(plugins) {
      for (var i = 0; i < plugins.length; i++) {
        var scriptEl = document.createElement('script');
        scriptEl.defer = true;
        scriptEl.src = '/' + plugins[i];
        document.body.appendChild(scriptEl);
      }
    },

    _loginTapHandler: function(e) {
      e.preventDefault();
      page.show('/login/' + encodeURIComponent(
          window.location.pathname + window.location.hash));
    },

    // Argument used for binding update only.
    _computeLoggedIn: function(account) {
      return !!(account && Object.keys(account).length > 0);
    },

    _handlePageError: function(e) {
      var response = e.detail.response;
      var err = {text: [response.status, response.statusText].join(' ')};
      if (response.status === 404) {
        err.emoji = '¯\\_(ツ)_/¯';
        this._lastError = err;
      } else {
        err.emoji = 'o_O';
        response.text().then(function(text) {
          err.moreInfo = text;
          this._lastError = err;
        }.bind(this));
      }
      this.$.pages.select('error');
    },

    _handleTitleChange: function(e) {
      if (e.detail.title) {
        document.title = e.detail.title + ' · Gerrit Code Review';
      } else {
        document.title = '';
      }
    },

    _handleKey: function(e) {
      if (this.shouldSupressKeyboardShortcut(e)) { return; }

      if (e.keyCode === 191 && e.shiftKey) {  // '/' or '?' with shift key.
        this.$.keyboardShortcuts.open();
      }
    },

    _handleKeyboardShortcutDialogClose: function() {
      this.$.keyboardShortcuts.close();
    },
  });
})();
