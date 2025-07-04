/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 766:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = true;
var EventHandler = /** @class */ (function () {
    function EventHandler() {
        this.events = [];
    }
    EventHandler.prototype.register = function (el, event, listener) {
        if (!el || !event || !listener)
            return null;
        this.events.push({ el: el, event: event, listener: listener });
        el.addEventListener(event, listener);
        return { el: el, event: event, listener: listener };
    };
    EventHandler.prototype.unregister = function (_a) {
        var el = _a.el, event = _a.event, listener = _a.listener;
        if (!el || !event || !listener)
            return null;
        this.events = this.events.filter(function (e) { return el !== e.el
            || event !== e.event || listener !== e.listener; });
        el.removeEventListener(event, listener);
        return { el: el, event: event, listener: listener };
    };
    EventHandler.prototype.unregisterAll = function () {
        this.events.forEach(function (_a) {
            var el = _a.el, event = _a.event, listener = _a.listener;
            return el.removeEventListener(event, listener);
        });
        this.events = [];
    };
    return EventHandler;
}());
exports.Z = EventHandler;


/***/ }),

/***/ 722:
/***/ (() => {

class VariantSelection extends HTMLElement {
  static get observedAttributes() {
    return ['variant'];
  }

  constructor() {
    super();
    this._loaded = false;
    this._productFetcher = Promise.resolve(false);

    this._onMainElChange = event => {
      this.variant = event.currentTarget.value;
    };

    const mainInputEl = this.querySelector('input[data-variants]');
    this._mainEl = mainInputEl || this.querySelector('select[data-variants]');
  }

  set variant(value) {
    if (value) {
      this.setAttribute('variant', value);
    } else {
      this.removeAttribute('variant');
    }
  }

  get variant() {
    return this.getAttribute('variant');
  }

  connectedCallback() {
    this._productFetcher = this._fetchProduct();
    const mainInputEl = this.querySelector('input[data-variants]');
    this._mainEl = mainInputEl || this.querySelector('select[data-variants]');

    this._mainEl.addEventListener('change', this._onMainElChange);

    this.variant = this._mainEl.value;
  }

  disconnectedCallback() {
    this._mainEl.removeEventListener('change', this._onMainElChange);

    this._mainEl = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'variant':
        this._changeVariant(newValue);

        break;
    }
  }

  getProduct() {
    return this._loaded ? Promise.resolve(this._product) : this._productFetcher;
  }

  getVariant() {
    return this.getProduct().then(product => product ? product.variants.find(v => v.id.toString() === this.variant) || false : false).catch(() => false);
  }

  getState() {
    return this.getVariant().then(variant => variant ? 'selected' : this.getAttribute('variant'));
  }

  _changeVariant(value) {
    this._dispatchEvent(value).then(() => {
      this._mainEl.value = value;
    });
  }

  _fetchProduct() {
    return fetch(this.getAttribute('product-url')).then(response => response.json()).then(product => {
      this._product = product;
      return product;
    }).catch(() => {
      this._product = null;
    }).finally(() => {
      this._loaded = true;
    });
  }

  _dispatchEvent(value) {
    return this.getProduct().then(product => {
      const variant = product ? product.variants.find(v => v.id.toString() === value) || false : false;
      const state = variant ? 'selected' : value;
      const event = new CustomEvent('variant-change', {
        detail: {
          product,
          variant,
          state
        }
      });
      this.dispatchEvent(event);
    });
  }

}

const unselectedValue = 'not-selected';
const unavailableValue = 'unavailable';
const inputTypeDropdown = 'select';
const inputTypeRadio = 'radio';
const valueElementType = {
  select: 'option',
  radio: 'input[type="radio"]'
};

function setSelectedOptions(selectOptions, radioOptions, selectedOptions) {
  selectOptions.forEach(({
    option
  }) => {
    option.value = selectedOptions[parseInt(option.dataset.variantOptionIndex, 10)];
  });
  radioOptions.forEach(({
    values
  }) => {
    values.forEach(value => {
      value.checked = value.value === selectedOptions[parseInt(value.dataset.variantOptionValueIndex, 10)];
    });
  });
}
/*
 * @param optionsEls [Element list] : Input elements for variant options
 *
 */


function getOptions(optionsEls) {
  const select = [];
  const radio = [];

  for (let i = 0; i < optionsEls.length; i++) {
    const optionEl = optionsEls[i]; // Options within select inputs or radio groups

    const variantOptionIndex = parseInt(optionEl.dataset.variantOptionIndex, 10);
    const valueMap = {};
    const wrappers = optionEl.matches('[data-variant-option-value-wrapper]') ? [optionEl] : Array.prototype.slice.call(optionEl.querySelectorAll('[data-variant-option-value-wrapper]'));
    const optionValueEls = optionEl.matches('[data-variant-option-value]') ? [optionEl] : Array.prototype.slice.call(optionEl.querySelectorAll('[data-variant-option-value]'));
    if (!optionValueEls.length) break;
    let current = unselectedValue;
    optionValueEls.forEach(el => {
      valueMap[el.value] = {
        available: false,
        accessible: false
      };

      if (el.hasAttribute('checked') || el.hasAttribute('selected')) {
        current = el.value;
      }
    });
    const option = {
      option: optionEl,
      variantOptionIndex,
      current,
      wrappers,
      optionValueEls,
      valueMap
    };

    if (optionValueEls[0].matches(valueElementType.select)) {
      option.type = inputTypeDropdown;
      select.push(option);
    } else if (optionValueEls[0].matches(valueElementType.radio)) {
      option.type = inputTypeRadio;
      radio.push(option);
    }
  }

  return {
    select,
    radio
  };
}

function getSelectedOptions(product, selectOptions, radioOptions) {
  const options = product.options.map(() => unselectedValue);
  selectOptions.forEach(({
    option
  }) => {
    if (option.value !== unselectedValue) {
      options[parseInt(option.dataset.variantOptionIndex, 10)] = option.value;
    }
  });
  radioOptions.forEach(({
    optionValueEls
  }) => {
    optionValueEls.forEach(value => {
      if (value.checked) {
        options[parseInt(value.dataset.variantOptionValueIndex, 10)] = value.value;
      }
    });
  });
  return options;
}

function getVariantFromSelectedOptions(variants, selectedOptions) {
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const isVariant = variant.options.every((option, index) => option === selectedOptions[index]);
    if (isVariant) return variant; // We found the variant
  }

  return false;
}

function getOptionsAccessibility(variants, option) {
  const optionValues = Object.keys(option.valueMap);

  if (optionValues.includes(unselectedValue)) {
    option.valueMap[unselectedValue].accessible = true;
  }

  variants.forEach(variant => {
    if (variant.available) {
      variant.options.forEach(variantOption => {
        if (optionValues.includes(variantOption)) {
          option.valueMap[variantOption].accessible = true;
        }
      });
    }
  });
  return option;
} // Returns whether the variant matches the selection filter prefix.
// // E.g. ["small", "red", "cotton"] matches ["small", "red"] but not ["small", "green"].
// // It also matches prefixes like [] and ["*", "red", "*"].


function matchesPrefix(variant, prefix) {
  if (prefix.every((v, i) => v === unselectedValue || variant.options[i] === v)) {
    // has to match unless it's 'not-selected', 'not-selected' matches everything
    return variant.available;
  }
}

function getVariantFromPartialSelection(variants, selection) {
  return variants.find(variant => {
    if (variant.available) {
      return selection.every((s, i) => s === unselectedValue || variant.options[i] === s);
    }

    return false;
  });
}

function updateOptions(product, selectOptions, radioOptions, selection, disableUnavailableOptions, removeUnavailableOptions, selectFirstAvailable) {
  let options = [...selectOptions, ...radioOptions];
  const {
    variants
  } = product;
  let nextAvailableVariant = null;
  options = options.map(option => getOptionsAccessibility(variants, option));
  options.sort((a, b) => a.variantOptionIndex - b.variantOptionIndex);

  if (options.length === 0) {
    return;
  }

  if (disableUnavailableOptions || removeUnavailableOptions) {
    // Only do this if we're disabling/hiding unavailable
    // Ensure the current selection has a match by unsetting options if necessary.
    // Does the selection match a variant? If not, unselect options starting at the last one
    while (!variants.some(v => matchesPrefix(v, selection))) {
      // Find the last set option and unset it.
      let i = selection.length - 1;

      while (i >= 0 && selection[i] === unselectedValue) {
        --i;
      }

      if (i === -1) {
        break;
      }

      if (options[i].option.value) {
        if (!selectFirstAvailable) {
          options[i].option.value = unselectedValue;
          options[i].current = unselectedValue;
        }
      }

      selection[i] = unselectedValue;
    }
  } // Determine which values in each option are selectable given the current selection.


  for (let i = 0; i < options.length; ++i) {
    const values = Object.keys(options[i].valueMap);

    for (let j = 0; j < values.length; ++j) {
      // input options
      const prefix = [...selection.slice(0, i), values[j]]; // given the current selection (ie. green/small), do any variants match?
      // If no variants match, it disables the option value in this iteration
      // disabling 'dead end' option values

      const selectable = variants.some(v => matchesPrefix(v, prefix));
      options[i].valueMap[values[j]].available = selectable;
    }
  } // If 'select first available variant' is enabled and we have some 'not-selected' values,
  // we should select options that match a variant


  if (selectFirstAvailable && selection.includes(unselectedValue)) {
    nextAvailableVariant = getVariantFromPartialSelection(variants, selection);

    if (nextAvailableVariant) {
      selection = nextAvailableVariant.options;
    }

    options.forEach(optionData => {
      const currentSelection = selection[optionData.variantOptionIndex];
      optionData.current = currentSelection;

      if (optionData.type === inputTypeDropdown) {
        optionData.option.value = currentSelection;
        optionData.optionValueEls.forEach(e => {
          e.selected = e.value === currentSelection;
        });
      } else {
        optionData.optionValueEls.forEach(e => {
          e.checked = e.value === currentSelection;
        });
      }
    });
  } else if (!selectFirstAvailable && selection.includes(unselectedValue)) {
    options.forEach(optionData => {
      // When selectFirstAvailableVariant is false, 
      // we need to manually set the 'checked' value to false for radio selections
      // because they don't have a default 'not-selected' option
      if (selection[optionData.variantOptionIndex] === unselectedValue && optionData.type !== inputTypeDropdown) {
        optionData.optionValueEls.forEach(e => {
          e.checked = false;
        });
      }
    });
  }

  for (let i = 0; i < product.options.length; i++) {
    // Corresponding select dropdown, if it exists
    const optionValues = options.find(({
      option
    }) => {
      if (parseInt(option.dataset.variantOptionIndex, 10) === i) {
        return true;
      }

      return false;
    });

    if (optionValues) {
      const fragment = document.createDocumentFragment();
      const {
        option,
        wrappers,
        optionValueEls
      } = optionValues;

      for (let j = optionValueEls.length - 1; j >= 0; j--) {
        const wrapper = wrappers[j];
        const optionValue = optionValueEls[j];
        const {
          value
        } = optionValue;
        const {
          available,
          accessible
        } = optionValues.valueMap[value];

        if (optionValue !== unselectedValue) {
          optionValue.disabled = disableUnavailableOptions && !available;
          optionValue.dataset.variantOptionAccessible = accessible;
          optionValue.dataset.variantOptionAvailable = available;

          if (!removeUnavailableOptions || accessible) {
            fragment.insertBefore(wrapper, fragment.firstElementChild);
          }
        }
      }

      option.innerHTML = '';
      option.appendChild(fragment);
      const chosenValue = optionValueEls.find(value => value.selected || value.checked);
      option.dataset.variantOptionChosenValue = chosenValue && chosenValue.value !== unselectedValue ? chosenValue.value : false;
    }
  }

  return selection;
}

class OptionsSelection extends HTMLElement {
  static get observedAttributes() {
    return ['variant-selection', 'disable-unavailable', 'remove-unavailable'];
  }

  static synchronize(mainOptionsSelection) {
    const mainVariantSelection = mainOptionsSelection.getVariantSelection(); // Fast return if we aren't associated with a variant selection

    if (!mainVariantSelection) return Promise.resolve(false);
    return mainOptionsSelection.getSelectedOptions().then(selectedOptions => {
      // Update all other options selects associated with the same variant ui
      const optionsSelections = document.querySelectorAll('options-selection');
      optionsSelections.forEach(optionsSelection => {
        if (optionsSelection !== mainOptionsSelection && optionsSelection.getVariantSelection() === mainVariantSelection) {
          optionsSelection.setSelectedOptions(selectedOptions);
        }
      });
    }).then(() => true);
  }

  constructor() {
    super();
    this.style.display = '';
    this._events = [];
    this._onChangeFn = this._onOptionChange.bind(this);
    this._optionsEls = this.querySelectorAll('[data-variant-option]');
    const options = getOptions(this._optionsEls);
    this._selectOptions = options.select;
    this._radioOptions = options.radio;

    this._associateVariantSelection(this.getAttribute('variant-selection'));
  }

  set variantSelection(value) {
    if (value) {
      this.setAttribute('variant-selection', value);
    } else {
      this.removeAttribute('variant-selection');
    }
  }

  get variantSelection() {
    return this.getAttribute('variant-selection');
  }

  connectedCallback() {
    this._optionsEls = this.querySelectorAll('[data-variant-option]');
    const options = getOptions(this._optionsEls);
    this._selectOptions = options.select;
    this._radioOptions = options.radio;

    this._associateVariantSelection(this.getAttribute('variant-selection'));

    this._selectOptions.forEach(({
      option
    }) => {
      option.addEventListener('change', this._onChangeFn);

      this._events.push({
        el: option,
        fn: this._onChangeFn
      });
    });

    this._radioOptions.forEach(({
      optionValueEls
    }) => {
      optionValueEls.forEach(value => {
        value.addEventListener('change', this._onChangeFn);

        this._events.push({
          el: value,
          fn: this._onChangeFn
        });
      });
    });

    this._onOptionChange();
  }

  disconnectedCallback() {
    this._resetOptions();

    this._events.forEach(({
      el,
      fn
    }) => el.removeEventListener('change', fn));

    this._events = [];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    switch (name) {
      case 'variant-selection':
        this._associateVariantSelection(newValue);

        break;

      case 'disable-unavailable':
      case 'remove-unavailable':
        this._updateOptions(this.hasAttribute('disable-unavailable'), this.hasAttribute('remove-unavailable'), this.hasAttribute('select-first-available'));

        break;
    }
  }

  getSelectedOptions() {
    if (!this._variantSelection) return Promise.resolve(null);
    return this._variantSelection.getProduct().then(product => {
      if (!product) return null;
      return getSelectedOptions(product, this._selectOptions, this._radioOptions);
    });
  }

  getVariantSelection() {
    return this._variantSelection;
  }

  setSelectedOptions(selectedOptions) {
    setSelectedOptions(this._selectOptions, this._radioOptions, selectedOptions);
    return this._updateOptions(this.hasAttribute('disable-unavailable'), this.hasAttribute('remove-unavailable'), this.hasAttribute('select-first-available'), selectedOptions);
  }

  _associateVariantSelection(id) {
    this._variantSelection = id ? document.getElementById(id) : this.closest('variant-selection');
  }

  _updateLabels() {
    // Update any labels
    const unavailableText = this.getAttribute('data-unavailable-text');

    for (let i = 0; i < this._optionsEls.length; i++) {
      const optionsEl = this._optionsEls[i];
      let optionsNameEl = null;
      let {
        parentElement
      } = optionsEl;

      while (parentElement && !optionsNameEl) {
        const tmpOptionsNameEl = parentElement.querySelector('[data-variant-option-name]');

        if (tmpOptionsNameEl) {
          optionsNameEl = tmpOptionsNameEl;
        }

        ({
          parentElement
        } = parentElement);
      }

      if (optionsNameEl) {
        optionsNameEl.dataset.variantOptionChosenValue = optionsEl.dataset.variantOptionChosenValue;

        if (optionsEl.dataset.variantOptionChosenValue !== 'false') {
          optionsNameEl.innerHTML = optionsNameEl.dataset.variantOptionName;
          const optionNameValueSpan = optionsNameEl.querySelector('span');

          if (optionNameValueSpan) {
            optionNameValueSpan.innerHTML = optionsEl.dataset.variantOptionChosenValue;
          }
        } else {
          optionsNameEl.innerHTML = optionsNameEl.dataset.variantOptionChooseName;
        }
      }

      if (!this.hasAttribute('disable-unavailable')) {
        const selectOptions = optionsEl.querySelectorAll('option');
        selectOptions.forEach(option => {
          let optionLabel = option.innerHTML.replace(`- ${unavailableText}`, '');

          if (option.dataset.variantOptionAvailable === 'false' && option.value !== unselectedValue) {
            optionLabel = `${optionLabel} - ${unavailableText}`;
          }

          option.innerHTML = optionLabel;
        });
      }
    }
  }

  _resetOptions() {
    return this._updateOptions(false, false, this.hasAttribute('select-first-available'));
  }

  _updateOptions(disableUnavailableOptions, removeUnavailableOptions, selectFirstAvailable, selectedOptions = null) {
    if (!this._variantSelection) return Promise.resolve(false);
    return this._variantSelection.getProduct().then(product => {
      const updatedSelection = updateOptions(product, this._selectOptions, this._radioOptions, selectedOptions || getSelectedOptions(product, this._selectOptions, this._radioOptions), disableUnavailableOptions, removeUnavailableOptions, selectFirstAvailable); // Use the 'updated' selection in case its changed due to disabled options

      this._updateVariantSelection(product, updatedSelection);

      this._updateLabels();
    }).then(() => true);
  }

  _updateVariantSelection(product, selectedOptions) {
    if (!this._variantSelection) return;
    const variant = getVariantFromSelectedOptions(product.variants, selectedOptions);
    const isNotSelected = selectedOptions.some(option => option === unselectedValue); // Update master select

    if (variant) {
      this._variantSelection.variant = variant.id;
    } else {
      this._variantSelection.variant = isNotSelected ? unselectedValue : unavailableValue;
    }
  }

  _onOptionChange() {
    if (!this._variantSelection) return;

    this._variantSelection.getProduct().then(product => {
      if (!product) return;
      let selectedOptions = getSelectedOptions(product, this._selectOptions, this._radioOptions);

      this._updateOptions(this.hasAttribute('disable-unavailable'), this.hasAttribute('remove-unavailable'), this.hasAttribute('select-first-available'), selectedOptions);

      OptionsSelection.synchronize(this);
    });
  }

}

if (!customElements.get('variant-selection')) {
  customElements.define('variant-selection', VariantSelection);
}

if (!customElements.get('options-selection')) {
  customElements.define('options-selection', OptionsSelection);
}


/***/ }),

/***/ 265:
/***/ (function(module) {

(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory();
	else {}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __nested_webpack_require_543__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __nested_webpack_require_543__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__nested_webpack_require_543__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__nested_webpack_require_543__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__nested_webpack_require_543__.d = function(exports, name, getter) {
/******/ 		if(!__nested_webpack_require_543__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__nested_webpack_require_543__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__nested_webpack_require_543__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __nested_webpack_require_543__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__nested_webpack_require_543__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __nested_webpack_require_543__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__nested_webpack_require_543__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__nested_webpack_require_543__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__nested_webpack_require_543__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__nested_webpack_require_543__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __nested_webpack_require_543__(__nested_webpack_require_543__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __nested_webpack_require_4019__) {

"use strict";
__nested_webpack_require_4019__.r(__webpack_exports__);

// CONCATENATED MODULE: ./src/tools.js
var argumentAsArray = function argumentAsArray(argument) {
  return Array.isArray(argument) ? argument : [argument];
};
var isElement = function isElement(target) {
  return target instanceof Node;
};
var isElementList = function isElementList(nodeList) {
  return nodeList instanceof NodeList;
};
var eachNode = function eachNode(nodeList, callback) {
  if (nodeList && callback) {
    nodeList = isElementList(nodeList) ? nodeList : [nodeList];

    for (var i = 0; i < nodeList.length; i++) {
      if (callback(nodeList[i], i, nodeList.length) === true) {
        break;
      }
    }
  }
};
var throwError = function throwError(message) {
  return console.error("[scroll-lock] ".concat(message));
};
var arrayAsSelector = function arrayAsSelector(array) {
  if (Array.isArray(array)) {
    var selector = array.join(', ');
    return selector;
  }
};
var nodeListAsArray = function nodeListAsArray(nodeList) {
  var nodes = [];
  eachNode(nodeList, function (node) {
    return nodes.push(node);
  });
  return nodes;
};
var findParentBySelector = function findParentBySelector($el, selector) {
  var self = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var $root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : document;

  if (self && nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) !== -1) {
    return $el;
  }

  while (($el = $el.parentElement) && nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) === -1) {
    ;
  }

  return $el;
};
var elementHasSelector = function elementHasSelector($el, selector) {
  var $root = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;
  var has = nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) !== -1;
  return has;
};
var elementHasOverflowHidden = function elementHasOverflowHidden($el) {
  if ($el) {
    var computedStyle = getComputedStyle($el);
    var overflowIsHidden = computedStyle.overflow === 'hidden';
    return overflowIsHidden;
  }
};
var elementScrollTopOnStart = function elementScrollTopOnStart($el) {
  if ($el) {
    if (elementHasOverflowHidden($el)) {
      return true;
    }

    var scrollTop = $el.scrollTop;
    return scrollTop <= 0;
  }
};
var elementScrollTopOnEnd = function elementScrollTopOnEnd($el) {
  if ($el) {
    if (elementHasOverflowHidden($el)) {
      return true;
    }

    var scrollTop = $el.scrollTop;
    var scrollHeight = $el.scrollHeight;
    var scrollTopWithHeight = scrollTop + $el.offsetHeight;
    return scrollTopWithHeight >= scrollHeight;
  }
};
var elementScrollLeftOnStart = function elementScrollLeftOnStart($el) {
  if ($el) {
    if (elementHasOverflowHidden($el)) {
      return true;
    }

    var scrollLeft = $el.scrollLeft;
    return scrollLeft <= 0;
  }
};
var elementScrollLeftOnEnd = function elementScrollLeftOnEnd($el) {
  if ($el) {
    if (elementHasOverflowHidden($el)) {
      return true;
    }

    var scrollLeft = $el.scrollLeft;
    var scrollWidth = $el.scrollWidth;
    var scrollLeftWithWidth = scrollLeft + $el.offsetWidth;
    return scrollLeftWithWidth >= scrollWidth;
  }
};
var elementIsScrollableField = function elementIsScrollableField($el) {
  var selector = 'textarea, [contenteditable="true"]';
  return elementHasSelector($el, selector);
};
var elementIsInputRange = function elementIsInputRange($el) {
  var selector = 'input[type="range"]';
  return elementHasSelector($el, selector);
};
// CONCATENATED MODULE: ./src/scroll-lock.js
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "disablePageScroll", function() { return disablePageScroll; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "enablePageScroll", function() { return enablePageScroll; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "getScrollState", function() { return getScrollState; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "clearQueueScrollLocks", function() { return clearQueueScrollLocks; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "getTargetScrollBarWidth", function() { return scroll_lock_getTargetScrollBarWidth; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "getCurrentTargetScrollBarWidth", function() { return scroll_lock_getCurrentTargetScrollBarWidth; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "getPageScrollBarWidth", function() { return getPageScrollBarWidth; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "getCurrentPageScrollBarWidth", function() { return getCurrentPageScrollBarWidth; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "addScrollableTarget", function() { return scroll_lock_addScrollableTarget; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "removeScrollableTarget", function() { return scroll_lock_removeScrollableTarget; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "addScrollableSelector", function() { return scroll_lock_addScrollableSelector; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "removeScrollableSelector", function() { return scroll_lock_removeScrollableSelector; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "addLockableTarget", function() { return scroll_lock_addLockableTarget; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "addLockableSelector", function() { return scroll_lock_addLockableSelector; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "setFillGapMethod", function() { return scroll_lock_setFillGapMethod; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "addFillGapTarget", function() { return scroll_lock_addFillGapTarget; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "removeFillGapTarget", function() { return scroll_lock_removeFillGapTarget; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "addFillGapSelector", function() { return scroll_lock_addFillGapSelector; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "removeFillGapSelector", function() { return scroll_lock_removeFillGapSelector; });
/* harmony export (binding) */ __nested_webpack_require_4019__.d(__webpack_exports__, "refillGaps", function() { return refillGaps; });
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var FILL_GAP_AVAILABLE_METHODS = ['padding', 'margin', 'width', 'max-width', 'none'];
var TOUCH_DIRECTION_DETECT_OFFSET = 3;
var state = {
  scroll: true,
  queue: 0,
  scrollableSelectors: ['[data-scroll-lock-scrollable]'],
  lockableSelectors: ['body', '[data-scroll-lock-lockable]'],
  fillGapSelectors: ['body', '[data-scroll-lock-fill-gap]', '[data-scroll-lock-lockable]'],
  fillGapMethod: FILL_GAP_AVAILABLE_METHODS[0],
  //
  startTouchY: 0,
  startTouchX: 0
};
var disablePageScroll = function disablePageScroll(target) {
  if (state.queue <= 0) {
    state.scroll = false;
    scroll_lock_hideLockableOverflow();
    fillGaps();
  }

  scroll_lock_addScrollableTarget(target);
  state.queue++;
};
var enablePageScroll = function enablePageScroll(target) {
  state.queue > 0 && state.queue--;

  if (state.queue <= 0) {
    state.scroll = true;
    scroll_lock_showLockableOverflow();
    unfillGaps();
  }

  scroll_lock_removeScrollableTarget(target);
};
var getScrollState = function getScrollState() {
  return state.scroll;
};
var clearQueueScrollLocks = function clearQueueScrollLocks() {
  state.queue = 0;
};
var scroll_lock_getTargetScrollBarWidth = function getTargetScrollBarWidth($target) {
  var onlyExists = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (isElement($target)) {
    var currentOverflowYProperty = $target.style.overflowY;

    if (onlyExists) {
      if (!getScrollState()) {
        $target.style.overflowY = $target.getAttribute('data-scroll-lock-saved-overflow-y-property');
      }
    } else {
      $target.style.overflowY = 'scroll';
    }

    var width = scroll_lock_getCurrentTargetScrollBarWidth($target);
    $target.style.overflowY = currentOverflowYProperty;
    return width;
  } else {
    return 0;
  }
};
var scroll_lock_getCurrentTargetScrollBarWidth = function getCurrentTargetScrollBarWidth($target) {
  if (isElement($target)) {
    if ($target === document.body) {
      var documentWidth = document.documentElement.clientWidth;
      var windowWidth = window.innerWidth;
      var currentWidth = windowWidth - documentWidth;
      return currentWidth;
    } else {
      var borderLeftWidthCurrentProperty = $target.style.borderLeftWidth;
      var borderRightWidthCurrentProperty = $target.style.borderRightWidth;
      $target.style.borderLeftWidth = '0px';
      $target.style.borderRightWidth = '0px';

      var _currentWidth = $target.offsetWidth - $target.clientWidth;

      $target.style.borderLeftWidth = borderLeftWidthCurrentProperty;
      $target.style.borderRightWidth = borderRightWidthCurrentProperty;
      return _currentWidth;
    }
  } else {
    return 0;
  }
};
var getPageScrollBarWidth = function getPageScrollBarWidth() {
  var onlyExists = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  return scroll_lock_getTargetScrollBarWidth(document.body, onlyExists);
};
var getCurrentPageScrollBarWidth = function getCurrentPageScrollBarWidth() {
  return scroll_lock_getCurrentTargetScrollBarWidth(document.body);
};
var scroll_lock_addScrollableTarget = function addScrollableTarget(target) {
  if (target) {
    var targets = argumentAsArray(target);
    targets.map(function ($targets) {
      eachNode($targets, function ($target) {
        if (isElement($target)) {
          $target.setAttribute('data-scroll-lock-scrollable', '');
        } else {
          throwError("\"".concat($target, "\" is not a Element."));
        }
      });
    });
  }
};
var scroll_lock_removeScrollableTarget = function removeScrollableTarget(target) {
  if (target) {
    var targets = argumentAsArray(target);
    targets.map(function ($targets) {
      eachNode($targets, function ($target) {
        if (isElement($target)) {
          $target.removeAttribute('data-scroll-lock-scrollable');
        } else {
          throwError("\"".concat($target, "\" is not a Element."));
        }
      });
    });
  }
};
var scroll_lock_addScrollableSelector = function addScrollableSelector(selector) {
  if (selector) {
    var selectors = argumentAsArray(selector);
    selectors.map(function (selector) {
      state.scrollableSelectors.push(selector);
    });
  }
};
var scroll_lock_removeScrollableSelector = function removeScrollableSelector(selector) {
  if (selector) {
    var selectors = argumentAsArray(selector);
    selectors.map(function (selector) {
      state.scrollableSelectors = state.scrollableSelectors.filter(function (sSelector) {
        return sSelector !== selector;
      });
    });
  }
};
var scroll_lock_addLockableTarget = function addLockableTarget(target) {
  if (target) {
    var targets = argumentAsArray(target);
    targets.map(function ($targets) {
      eachNode($targets, function ($target) {
        if (isElement($target)) {
          $target.setAttribute('data-scroll-lock-lockable', '');
        } else {
          throwError("\"".concat($target, "\" is not a Element."));
        }
      });
    });

    if (!getScrollState()) {
      scroll_lock_hideLockableOverflow();
    }
  }
};
var scroll_lock_addLockableSelector = function addLockableSelector(selector) {
  if (selector) {
    var selectors = argumentAsArray(selector);
    selectors.map(function (selector) {
      state.lockableSelectors.push(selector);
    });

    if (!getScrollState()) {
      scroll_lock_hideLockableOverflow();
    }

    scroll_lock_addFillGapSelector(selector);
  }
};
var scroll_lock_setFillGapMethod = function setFillGapMethod(method) {
  if (method) {
    if (FILL_GAP_AVAILABLE_METHODS.indexOf(method) !== -1) {
      state.fillGapMethod = method;
      refillGaps();
    } else {
      var methods = FILL_GAP_AVAILABLE_METHODS.join(', ');
      throwError("\"".concat(method, "\" method is not available!\nAvailable fill gap methods: ").concat(methods, "."));
    }
  }
};
var scroll_lock_addFillGapTarget = function addFillGapTarget(target) {
  if (target) {
    var targets = argumentAsArray(target);
    targets.map(function ($targets) {
      eachNode($targets, function ($target) {
        if (isElement($target)) {
          $target.setAttribute('data-scroll-lock-fill-gap', '');

          if (!state.scroll) {
            scroll_lock_fillGapTarget($target);
          }
        } else {
          throwError("\"".concat($target, "\" is not a Element."));
        }
      });
    });
  }
};
var scroll_lock_removeFillGapTarget = function removeFillGapTarget(target) {
  if (target) {
    var targets = argumentAsArray(target);
    targets.map(function ($targets) {
      eachNode($targets, function ($target) {
        if (isElement($target)) {
          $target.removeAttribute('data-scroll-lock-fill-gap');

          if (!state.scroll) {
            scroll_lock_unfillGapTarget($target);
          }
        } else {
          throwError("\"".concat($target, "\" is not a Element."));
        }
      });
    });
  }
};
var scroll_lock_addFillGapSelector = function addFillGapSelector(selector) {
  if (selector) {
    var selectors = argumentAsArray(selector);
    selectors.map(function (selector) {
      if (state.fillGapSelectors.indexOf(selector) === -1) {
        state.fillGapSelectors.push(selector);

        if (!state.scroll) {
          scroll_lock_fillGapSelector(selector);
        }
      }
    });
  }
};
var scroll_lock_removeFillGapSelector = function removeFillGapSelector(selector) {
  if (selector) {
    var selectors = argumentAsArray(selector);
    selectors.map(function (selector) {
      state.fillGapSelectors = state.fillGapSelectors.filter(function (fSelector) {
        return fSelector !== selector;
      });

      if (!state.scroll) {
        scroll_lock_unfillGapSelector(selector);
      }
    });
  }
};
var refillGaps = function refillGaps() {
  if (!state.scroll) {
    fillGaps();
  }
};

var scroll_lock_hideLockableOverflow = function hideLockableOverflow() {
  var selector = arrayAsSelector(state.lockableSelectors);
  scroll_lock_hideLockableOverflowSelector(selector);
};

var scroll_lock_showLockableOverflow = function showLockableOverflow() {
  var selector = arrayAsSelector(state.lockableSelectors);
  scroll_lock_showLockableOverflowSelector(selector);
};

var scroll_lock_hideLockableOverflowSelector = function hideLockableOverflowSelector(selector) {
  var $targets = document.querySelectorAll(selector);
  eachNode($targets, function ($target) {
    scroll_lock_hideLockableOverflowTarget($target);
  });
};

var scroll_lock_showLockableOverflowSelector = function showLockableOverflowSelector(selector) {
  var $targets = document.querySelectorAll(selector);
  eachNode($targets, function ($target) {
    scroll_lock_showLockableOverflowTarget($target);
  });
};

var scroll_lock_hideLockableOverflowTarget = function hideLockableOverflowTarget($target) {
  if (isElement($target) && $target.getAttribute('data-scroll-lock-locked') !== 'true') {
    var computedStyle = window.getComputedStyle($target);
    $target.setAttribute('data-scroll-lock-saved-overflow-y-property', computedStyle.overflowY);
    $target.setAttribute('data-scroll-lock-saved-inline-overflow-property', $target.style.overflow);
    $target.setAttribute('data-scroll-lock-saved-inline-overflow-y-property', $target.style.overflowY);
    $target.style.overflow = 'hidden';
    $target.setAttribute('data-scroll-lock-locked', 'true');
  }
};

var scroll_lock_showLockableOverflowTarget = function showLockableOverflowTarget($target) {
  if (isElement($target) && $target.getAttribute('data-scroll-lock-locked') === 'true') {
    $target.style.overflow = $target.getAttribute('data-scroll-lock-saved-inline-overflow-property');
    $target.style.overflowY = $target.getAttribute('data-scroll-lock-saved-inline-overflow-y-property');
    $target.removeAttribute('data-scroll-lock-saved-overflow-property');
    $target.removeAttribute('data-scroll-lock-saved-inline-overflow-property');
    $target.removeAttribute('data-scroll-lock-saved-inline-overflow-y-property');
    $target.removeAttribute('data-scroll-lock-locked');
  }
};

var fillGaps = function fillGaps() {
  state.fillGapSelectors.map(function (selector) {
    scroll_lock_fillGapSelector(selector);
  });
};

var unfillGaps = function unfillGaps() {
  state.fillGapSelectors.map(function (selector) {
    scroll_lock_unfillGapSelector(selector);
  });
};

var scroll_lock_fillGapSelector = function fillGapSelector(selector) {
  var $targets = document.querySelectorAll(selector);
  var isLockable = state.lockableSelectors.indexOf(selector) !== -1;
  eachNode($targets, function ($target) {
    scroll_lock_fillGapTarget($target, isLockable);
  });
};

var scroll_lock_fillGapTarget = function fillGapTarget($target) {
  var isLockable = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (isElement($target)) {
    var scrollBarWidth;

    if ($target.getAttribute('data-scroll-lock-lockable') === '' || isLockable) {
      scrollBarWidth = scroll_lock_getTargetScrollBarWidth($target, true);
    } else {
      var $lockableParent = findParentBySelector($target, arrayAsSelector(state.lockableSelectors));
      scrollBarWidth = scroll_lock_getTargetScrollBarWidth($lockableParent, true);
    }

    if ($target.getAttribute('data-scroll-lock-filled-gap') === 'true') {
      scroll_lock_unfillGapTarget($target);
    }

    var computedStyle = window.getComputedStyle($target);
    $target.setAttribute('data-scroll-lock-filled-gap', 'true');
    $target.setAttribute('data-scroll-lock-current-fill-gap-method', state.fillGapMethod);

    if (state.fillGapMethod === 'margin') {
      var currentMargin = parseFloat(computedStyle.marginRight);
      $target.style.marginRight = "".concat(currentMargin + scrollBarWidth, "px");
    } else if (state.fillGapMethod === 'width') {
      $target.style.width = "calc(100% - ".concat(scrollBarWidth, "px)");
    } else if (state.fillGapMethod === 'max-width') {
      $target.style.maxWidth = "calc(100% - ".concat(scrollBarWidth, "px)");
    } else if (state.fillGapMethod === 'padding') {
      var currentPadding = parseFloat(computedStyle.paddingRight);
      $target.style.paddingRight = "".concat(currentPadding + scrollBarWidth, "px");
    }
  }
};

var scroll_lock_unfillGapSelector = function unfillGapSelector(selector) {
  var $targets = document.querySelectorAll(selector);
  eachNode($targets, function ($target) {
    scroll_lock_unfillGapTarget($target);
  });
};

var scroll_lock_unfillGapTarget = function unfillGapTarget($target) {
  if (isElement($target)) {
    if ($target.getAttribute('data-scroll-lock-filled-gap') === 'true') {
      var currentFillGapMethod = $target.getAttribute('data-scroll-lock-current-fill-gap-method');
      $target.removeAttribute('data-scroll-lock-filled-gap');
      $target.removeAttribute('data-scroll-lock-current-fill-gap-method');

      if (currentFillGapMethod === 'margin') {
        $target.style.marginRight = "";
      } else if (currentFillGapMethod === 'width') {
        $target.style.width = "";
      } else if (currentFillGapMethod === 'max-width') {
        $target.style.maxWidth = "";
      } else if (currentFillGapMethod === 'padding') {
        $target.style.paddingRight = "";
      }
    }
  }
};

var onResize = function onResize(e) {
  refillGaps();
};

var onTouchStart = function onTouchStart(e) {
  if (!state.scroll) {
    state.startTouchY = e.touches[0].clientY;
    state.startTouchX = e.touches[0].clientX;
  }
};

var scroll_lock_onTouchMove = function onTouchMove(e) {
  if (!state.scroll) {
    var startTouchY = state.startTouchY,
        startTouchX = state.startTouchX;
    var currentClientY = e.touches[0].clientY;
    var currentClientX = e.touches[0].clientX;

    if (e.touches.length < 2) {
      var selector = arrayAsSelector(state.scrollableSelectors);
      var direction = {
        up: startTouchY < currentClientY,
        down: startTouchY > currentClientY,
        left: startTouchX < currentClientX,
        right: startTouchX > currentClientX
      };
      var directionWithOffset = {
        up: startTouchY + TOUCH_DIRECTION_DETECT_OFFSET < currentClientY,
        down: startTouchY - TOUCH_DIRECTION_DETECT_OFFSET > currentClientY,
        left: startTouchX + TOUCH_DIRECTION_DETECT_OFFSET < currentClientX,
        right: startTouchX - TOUCH_DIRECTION_DETECT_OFFSET > currentClientX
      };

      var handle = function handle($el) {
        var skip = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if ($el) {
          var parentScrollableEl = findParentBySelector($el, selector, false);

          if (elementIsInputRange($el)) {
            return false;
          }

          if (skip || elementIsScrollableField($el) && findParentBySelector($el, selector) || elementHasSelector($el, selector)) {
            var prevent = false;

            if (elementScrollLeftOnStart($el) && elementScrollLeftOnEnd($el)) {
              if (direction.up && elementScrollTopOnStart($el) || direction.down && elementScrollTopOnEnd($el)) {
                prevent = true;
              }
            } else if (elementScrollTopOnStart($el) && elementScrollTopOnEnd($el)) {
              if (direction.left && elementScrollLeftOnStart($el) || direction.right && elementScrollLeftOnEnd($el)) {
                prevent = true;
              }
            } else if (directionWithOffset.up && elementScrollTopOnStart($el) || directionWithOffset.down && elementScrollTopOnEnd($el) || directionWithOffset.left && elementScrollLeftOnStart($el) || directionWithOffset.right && elementScrollLeftOnEnd($el)) {
              prevent = true;
            }

            if (prevent) {
              if (parentScrollableEl) {
                handle(parentScrollableEl, true);
              } else {
                if (e.cancelable) {
                  e.preventDefault();
                }
              }
            }
          } else {
            handle(parentScrollableEl);
          }
        } else {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      };

      handle(e.target);
    }
  }
};

var onTouchEnd = function onTouchEnd(e) {
  if (!state.scroll) {
    state.startTouchY = 0;
    state.startTouchX = 0;
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('resize', onResize);
}

if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', onTouchStart);
  document.addEventListener('touchmove', scroll_lock_onTouchMove, {
    passive: false
  });
  document.addEventListener('touchend', onTouchEnd);
}

var deprecatedMethods = {
  hide: function hide(target) {
    throwError('"hide" is deprecated! Use "disablePageScroll" instead. \n https://github.com/FL3NKEY/scroll-lock#disablepagescrollscrollabletarget');
    disablePageScroll(target);
  },
  show: function show(target) {
    throwError('"show" is deprecated! Use "enablePageScroll" instead. \n https://github.com/FL3NKEY/scroll-lock#enablepagescrollscrollabletarget');
    enablePageScroll(target);
  },
  toggle: function toggle(target) {
    throwError('"toggle" is deprecated! Do not use it.');

    if (getScrollState()) {
      disablePageScroll();
    } else {
      enablePageScroll(target);
    }
  },
  getState: function getState() {
    throwError('"getState" is deprecated! Use "getScrollState" instead. \n https://github.com/FL3NKEY/scroll-lock#getscrollstate');
    return getScrollState();
  },
  getWidth: function getWidth() {
    throwError('"getWidth" is deprecated! Use "getPageScrollBarWidth" instead. \n https://github.com/FL3NKEY/scroll-lock#getpagescrollbarwidth');
    return getPageScrollBarWidth();
  },
  getCurrentWidth: function getCurrentWidth() {
    throwError('"getCurrentWidth" is deprecated! Use "getCurrentPageScrollBarWidth" instead. \n https://github.com/FL3NKEY/scroll-lock#getcurrentpagescrollbarwidth');
    return getCurrentPageScrollBarWidth();
  },
  setScrollableTargets: function setScrollableTargets(target) {
    throwError('"setScrollableTargets" is deprecated! Use "addScrollableTarget" instead. \n https://github.com/FL3NKEY/scroll-lock#addscrollabletargetscrollabletarget');
    scroll_lock_addScrollableTarget(target);
  },
  setFillGapSelectors: function setFillGapSelectors(selector) {
    throwError('"setFillGapSelectors" is deprecated! Use "addFillGapSelector" instead. \n https://github.com/FL3NKEY/scroll-lock#addfillgapselectorfillgapselector');
    scroll_lock_addFillGapSelector(selector);
  },
  setFillGapTargets: function setFillGapTargets(target) {
    throwError('"setFillGapTargets" is deprecated! Use "addFillGapTarget" instead. \n https://github.com/FL3NKEY/scroll-lock#addfillgaptargetfillgaptarget');
    scroll_lock_addFillGapTarget(target);
  },
  clearQueue: function clearQueue() {
    throwError('"clearQueue" is deprecated! Use "clearQueueScrollLocks" instead. \n https://github.com/FL3NKEY/scroll-lock#clearqueuescrolllocks');
    clearQueueScrollLocks();
  }
};

var scrollLock = _objectSpread({
  disablePageScroll: disablePageScroll,
  enablePageScroll: enablePageScroll,
  getScrollState: getScrollState,
  clearQueueScrollLocks: clearQueueScrollLocks,
  getTargetScrollBarWidth: scroll_lock_getTargetScrollBarWidth,
  getCurrentTargetScrollBarWidth: scroll_lock_getCurrentTargetScrollBarWidth,
  getPageScrollBarWidth: getPageScrollBarWidth,
  getCurrentPageScrollBarWidth: getCurrentPageScrollBarWidth,
  addScrollableSelector: scroll_lock_addScrollableSelector,
  removeScrollableSelector: scroll_lock_removeScrollableSelector,
  addScrollableTarget: scroll_lock_addScrollableTarget,
  removeScrollableTarget: scroll_lock_removeScrollableTarget,
  addLockableSelector: scroll_lock_addLockableSelector,
  addLockableTarget: scroll_lock_addLockableTarget,
  addFillGapSelector: scroll_lock_addFillGapSelector,
  removeFillGapSelector: scroll_lock_removeFillGapSelector,
  addFillGapTarget: scroll_lock_addFillGapTarget,
  removeFillGapTarget: scroll_lock_removeFillGapTarget,
  setFillGapMethod: scroll_lock_setFillGapMethod,
  refillGaps: refillGaps,
  _state: state
}, deprecatedMethods);

/* harmony default export */ var scroll_lock = __webpack_exports__["default"] = (scrollLock);

/***/ })
/******/ ])["default"];
});

/***/ }),

/***/ 616:
/***/ ((module) => {

function _iterableToArrayLimit(arr, i) {
  var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"];
  if (null != _i) {
    var _s,
      _e,
      _x,
      _r,
      _arr = [],
      _n = !0,
      _d = !1;
    try {
      if (_x = (_i = _i.call(arr)).next, 0 === i) {
        if (Object(_i) !== _i) return;
        _n = !1;
      } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0);
    } catch (err) {
      _d = !0, _e = err;
    } finally {
      try {
        if (!_n && null != _i.return && (_r = _i.return(), Object(_r) !== _r)) return;
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
function _classPrivateFieldGet(receiver, privateMap) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");
  return _classApplyDescriptorGet(receiver, descriptor);
}
function _classPrivateFieldSet(receiver, privateMap, value) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
  _classApplyDescriptorSet(receiver, descriptor, value);
  return value;
}
function _classExtractFieldDescriptor(receiver, privateMap, action) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to " + action + " private field on non-instance");
  }
  return privateMap.get(receiver);
}
function _classApplyDescriptorGet(receiver, descriptor) {
  if (descriptor.get) {
    return descriptor.get.call(receiver);
  }
  return descriptor.value;
}
function _classApplyDescriptorSet(receiver, descriptor, value) {
  if (descriptor.set) {
    descriptor.set.call(receiver, value);
  } else {
    if (!descriptor.writable) {
      throw new TypeError("attempted to set read only private field");
    }
    descriptor.value = value;
  }
}
function _classPrivateMethodGet(receiver, privateSet, fn) {
  if (!privateSet.has(receiver)) {
    throw new TypeError("attempted to get private field on non-instance");
  }
  return fn;
}
function _checkPrivateRedeclaration(obj, privateCollection) {
  if (privateCollection.has(obj)) {
    throw new TypeError("Cannot initialize the same private elements twice on an object");
  }
}
function _classPrivateFieldInitSpec(obj, privateMap, value) {
  _checkPrivateRedeclaration(obj, privateMap);
  privateMap.set(obj, value);
}
function _classPrivateMethodInitSpec(obj, privateSet) {
  _checkPrivateRedeclaration(obj, privateSet);
  privateSet.add(obj);
}

var list = [
	" daum[ /]",
	" deusu/",
	"(?:^| )site",
	"@[a-z]",
	"\\(at\\)[a-z]",
	"\\(github\\.com/",
	"\\[at\\][a-z]",
	"^12345",
	"^<",
	"^[\\w \\.\\-\\(\\)]+(/v?\\d+(\\.\\d+)?(\\.\\d{1,10})?)?$",
	"^[^ ]{50,}$",
	"^active",
	"^ad muncher",
	"^anglesharp/",
	"^anonymous",
	"^avsdevicesdk/",
	"^axios/",
	"^bidtellect/",
	"^biglotron",
	"^castro",
	"^clamav[ /]",
	"^cobweb/",
	"^coccoc",
	"^custom",
	"^ddg[_-]android",
	"^discourse",
	"^dispatch/\\d",
	"^downcast/",
	"^duckduckgo",
	"^facebook",
	"^fdm[ /]\\d",
	"^getright/",
	"^gozilla/",
	"^hatena",
	"^hobbit",
	"^hotzonu",
	"^hwcdn/",
	"^jeode/",
	"^jetty/",
	"^jigsaw",
	"^linkdex",
	"^lwp[-: ]",
	"^metauri",
	"^microsoft bits",
	"^movabletype",
	"^mozilla/\\d\\.\\d \\(compatible;?\\)$",
	"^mozilla/\\d\\.\\d \\w*$",
	"^navermailapp",
	"^netsurf",
	"^offline explorer",
	"^phantom",
	"^php",
	"^postman",
	"^postrank",
	"^python",
	"^read",
	"^reed",
	"^restsharp/",
	"^snapchat",
	"^space bison",
	"^svn",
	"^swcd ",
	"^taringa",
	"^test certificate info",
	"^thumbor/",
	"^tumblr/",
	"^user-agent:mozilla",
	"^valid",
	"^venus/fedoraplanet",
	"^w3c",
	"^webbandit/",
	"^webcopier",
	"^wget",
	"^whatsapp",
	"^xenu link sleuth",
	"^yahoo",
	"^yandex",
	"^zdm/\\d",
	"^zoom marketplace/",
	"^$",
	"adbeat\\.com",
	"appinsights",
	"archive",
	"ask jeeves/teoma",
	"bit\\.ly/",
	"bluecoat drtr",
	"bot",
	"browsex",
	"burpcollaborator",
	"capture",
	"catch",
	"check",
	"chrome-lighthouse",
	"chromeframe",
	"client",
	"cloud",
	"crawl",
	"cryptoapi",
	"dareboost",
	"datanyze",
	"dataprovider",
	"dejaclick",
	"dmbrowser",
	"download",
	"evc-batch/",
	"feed",
	"firephp",
	"freesafeip",
	"ghost",
	"gomezagent",
	"google",
	"headlesschrome/",
	"http",
	"httrack",
	"hubspot marketing grader",
	"hydra",
	"ibisbrowser",
	"images",
	"iplabel",
	"ips-agent",
	"java",
	"library",
	"mail\\.ru/",
	"manager",
	"monitor",
	"morningscore/",
	"neustar wpm",
	"news",
	"nutch",
	"offbyone",
	"optimize",
	"pageburst",
	"pagespeed",
	"perl",
	"pingdom",
	"powermarks",
	"preview",
	"proxy",
	"ptst[ /]\\d",
	"reader",
	"rexx;",
	"rigor",
	"rss",
	"scan",
	"scrape",
	"search",
	"serp ?reputation ?management",
	"server",
	"sogou",
	"sparkler/",
	"spider",
	"statuscake",
	"stumbleupon\\.com",
	"supercleaner",
	"synapse",
	"synthetic",
	"taginspector/",
	"torrent",
	"tracemyfile",
	"transcoder",
	"trendsmapresolver",
	"twingly recon",
	"url",
	"virtuoso",
	"wappalyzer",
	"webglance",
	"webkit2png",
	"websitemetadataretriever",
	"whatcms/",
	"wordpress",
	"zgrab"
];

/**
 * Mutate given list of patter strings
 * @param {string[]} list
 * @returns {string[]}
 */
function amend(list) {
  try {
    // Risk: Uses lookbehind assertion, avoid breakage in parsing by using RegExp constructor
    new RegExp('(?<! cu)bot').test('dangerbot'); // eslint-disable-line prefer-regex-literals
  } catch (error) {
    // Skip regex fixes
    return list;
  }
  [
  // Addresses: Cubot device
  ['bot', '(?<! cu)bot'],
  // Addresses: Android webview
  ['google', '(?<! (?:channel/|google/))google(?!(app|/google| pixel))'],
  // Addresses: libhttp browser
  ['http', '(?<!(?:lib))http'],
  // Addresses: java based browsers
  ['java', 'java(?!;)'],
  // Addresses: Yandex Search App
  ['search', '(?<! ya(?:yandex)?)search']].forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      search = _ref2[0],
      replace = _ref2[1];
    var index = list.lastIndexOf(search);
    if (~index) {
      list.splice(index, 1, replace);
    }
  });
  return list;
}

amend(list);
var flags = 'i';

/**
 * Test user agents for matching patterns
 */
var _list = /*#__PURE__*/new WeakMap();
var _pattern = /*#__PURE__*/new WeakMap();
var _update = /*#__PURE__*/new WeakSet();
var _index = /*#__PURE__*/new WeakSet();
var Isbot = /*#__PURE__*/function () {
  /**
   * @type {string[]}
   */

  /**
   * @type {RegExp}
   */

  function Isbot(patterns) {
    var _this = this;
    _classCallCheck(this, Isbot);
    _classPrivateMethodInitSpec(this, _index);
    _classPrivateMethodInitSpec(this, _update);
    _classPrivateFieldInitSpec(this, _list, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldInitSpec(this, _pattern, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldSet(this, _list, patterns || list.slice());
    _classPrivateMethodGet(this, _update, _update2).call(this);
    var isbot = function isbot(ua) {
      return _this.test(ua);
    };
    return Object.defineProperties(isbot, Object.entries(Object.getOwnPropertyDescriptors(Isbot.prototype)).reduce(function (accumulator, _ref) {
      var _ref2 = _slicedToArray(_ref, 2),
        prop = _ref2[0],
        descriptor = _ref2[1];
      if (typeof descriptor.value === 'function') {
        Object.assign(accumulator, _defineProperty({}, prop, {
          value: _this[prop].bind(_this)
        }));
      }
      if (typeof descriptor.get === 'function') {
        Object.assign(accumulator, _defineProperty({}, prop, {
          get: function get() {
            return _this[prop];
          }
        }));
      }
      return accumulator;
    }, {}));
  }

  /**
   * Recreate the pattern from rules list
   */
  _createClass(Isbot, [{
    key: "pattern",
    get:
    /**
     * Get a clone of the pattern
     * @type RegExp
     */
    function get() {
      return new RegExp(_classPrivateFieldGet(this, _pattern));
    }

    /**
     * Match given string against out pattern
     * @param  {string} ua User Agent string
     * @returns {boolean}
     */
  }, {
    key: "test",
    value: function test(ua) {
      return Boolean(ua) && _classPrivateFieldGet(this, _pattern).test(ua);
    }

    /**
     * Get the match for strings' known crawler pattern
     * @param  {string} ua User Agent string
     * @returns {string|null}
     */
  }, {
    key: "find",
    value: function find() {
      var ua = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var match = ua.match(_classPrivateFieldGet(this, _pattern));
      return match && match[0];
    }

    /**
     * Get the patterns that match user agent string if any
     * @param  {string} ua User Agent string
     * @returns {string[]}
     */
  }, {
    key: "matches",
    value: function matches() {
      var ua = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      return _classPrivateFieldGet(this, _list).filter(function (entry) {
        return new RegExp(entry, flags).test(ua);
      });
    }

    /**
     * Clear all patterns that match user agent
     * @param  {string} ua User Agent string
     * @returns {void}
     */
  }, {
    key: "clear",
    value: function clear() {
      var ua = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      this.exclude(this.matches(ua));
    }

    /**
     * Extent patterns for known crawlers
     * @param  {string[]} filters
     * @returns {void}
     */
  }, {
    key: "extend",
    value: function extend() {
      var _this2 = this;
      var filters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      [].push.apply(_classPrivateFieldGet(this, _list), filters.filter(function (rule) {
        return _classPrivateMethodGet(_this2, _index, _index2).call(_this2, rule) === -1;
      }).map(function (filter) {
        return filter.toLowerCase();
      }));
      _classPrivateMethodGet(this, _update, _update2).call(this);
    }

    /**
     * Exclude patterns from bot pattern rule
     * @param  {string[]} filters
     * @returns {void}
     */
  }, {
    key: "exclude",
    value: function exclude() {
      var filters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var length = filters.length;
      while (length--) {
        var index = _classPrivateMethodGet(this, _index, _index2).call(this, filters[length]);
        if (index > -1) {
          _classPrivateFieldGet(this, _list).splice(index, 1);
        }
      }
      _classPrivateMethodGet(this, _update, _update2).call(this);
    }

    /**
     * Create a new Isbot instance using given list or self's list
     * @param  {string[]} [list]
     * @returns {Isbot}
     */
  }, {
    key: "spawn",
    value: function spawn(list) {
      return new Isbot(list || _classPrivateFieldGet(this, _list));
    }
  }]);
  return Isbot;
}();
function _update2() {
  _classPrivateFieldSet(this, _pattern, new RegExp(_classPrivateFieldGet(this, _list).join('|'), flags));
}
function _index2(rule) {
  return _classPrivateFieldGet(this, _list).indexOf(rule.toLowerCase());
}

var isbot = new Isbot();

module.exports = isbot;
//# sourceMappingURL=index.js.map


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

// EXTERNAL MODULE: ./node_modules/@pixelunion/shopify-variants-ui/dist/index.es.js
var index_es = __webpack_require__(722);
;// CONCATENATED MODULE: ./node_modules/@pixelunion/rimg-shopify/dist/index.es.js
/*!
 * @pixelunion/rimg-shopify v2.7.1
 * (c) 2023 Pixel Union
 */
/*!
 * @pixelunion/rimg v2.2.2
 * (c) 2022 Pixel Union
 */

/**
 * The default template render function. Turns a template string into an image
 * URL.
 *
 * @param {String} template
 * @param {Size} size
 * @returns {String}
 */
function defaultTemplateRender(template, size) {
  return template.replace('{size}', "".concat(size.width, "x").concat(size.height));
}
/**
 * @type Settings
 */


var defaults = {
  scale: 1,
  template: false,
  templateRender: defaultTemplateRender,
  max: {
    width: Infinity,
    height: Infinity
  },
  round: 32,
  placeholder: false,
  crop: null
};
/**
 * Get a data attribute value from an element, with a default fallback and
 * sanitization step.
 *
 * @param {Element} el
 *
 * @param {String} name
 *        The data attribute name.
 *
 * @param {Object} options
 *        An object holding fallback values if the data attribute does not
 *        exist. If this object doesn't have the property, we further fallback
 *        to our defaults.
 *
 * @param {Function} [sanitize]
 *        A function to sanitize the data attribute value with.
 *
 * @returns {String|*}
 */

function getData(el, name, options, sanitize) {
  var attr = "data-rimg-".concat(name);
  if (!el.hasAttribute(attr)) return options[name] || defaults[name];
  var value = el.getAttribute(attr);
  return sanitize ? sanitize(value) : value;
}
/**
 * Sanitize data attributes that represent a size (in the form of `10x10`).
 *
 * @param {String} value
 * @returns {Object} An object with `width` and `height` properties.
 */


function parseSize(value) {
  value = value.split('x');
  return {
    width: parseInt(value[0], 10),
    height: parseInt(value[1], 10)
  };
}
/**
 * Sanitize crop values to ensure they are valid, or null
 *
 * @param {String} value
 * @returns {Object} Shopify crop parameter ('top', 'center', 'bottom', 'left', 'right') or null, if an unsupported value is found
 */


function processCropValue(value) {
  switch (value) {
    case 'top':
    case 'center':
    case 'bottom':
    case 'left':
    case 'right':
      return value;

    default:
      return null;
  }
}
/**
 * Loads information about an element.
 *
 * Options can be set on the element itself using data attributes, or through
 * the `options` parameter. Data attributes take priority.
 *
 * @param {HTMLElement} el
 * @param {Settings} options
 * @returns {Item}
 */


function parseItem(el) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var isImage = el.hasAttribute('data-rimg-template');
  /**
   * @typedef {Settings} Item
   */

  return {
    el: el,
    // Type of element
    isImage: isImage,
    isBackgroundImage: isImage && el.tagName !== 'IMG',
    // Image scale
    scale: parseInt(getData(el, 'scale', options)),
    // Device density
    density: window.devicePixelRatio || 1,
    // Image template URL
    template: getData(el, 'template', options),
    templateRender: options.templateRender || defaults.templateRender,
    // Maximum image dimensions
    max: getData(el, 'max', options, parseSize),
    // Round image dimensions to the nearest multiple
    round: getData(el, 'round', options),
    // Placeholder image dimensions
    placeholder: getData(el, 'placeholder', options, parseSize),
    // Crop value; null if image is uncropped, otherwise equal to the Shopify crop parameter ('center', 'top', etc.)
    crop: getData(el, 'crop', options, processCropValue)
  };
}
/**
 * Round to the nearest multiple.
 *
 * This is so we don't tax the image server too much.
 *
 * @param {Number} size The size, in pixels.
 * @param {Number} [multiple] The multiple to round to the nearest.
 * @param {Number} [maxLimit] Maximum allowed value - value to return if rounded multiple is above this limit
 * @returns {Number}
 */


function roundSize(size) {
  var multiple = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 32;
  var maxLimit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;
  return size === 0 ? multiple : Math.min(Math.ceil(size / multiple) * multiple, maxLimit);
}
/**
 * Get the size of an element.
 *
 * If it is too small, it's parent element is checked, and so on. This helps
 * avoid the situation where an element doesn't have a size yet or is positioned
 * out of the layout.
 *
 * @param {HTMLElement} el
 * @return {Object} size
 * @return {Number} size.width The width, in pixels.
 * @return {Number} size.height The height, in pixels.
 */


function getElementSize(el) {
  var size = {
    width: 0,
    height: 0
  };

  while (el) {
    size.width = el.offsetWidth;
    size.height = el.offsetHeight;
    if (size.width > 20 && size.height > 20) break;
    el = el.parentNode;
  }

  return size;
}
/**
 * Return the maximum supported density of the image, given the container.
 *
 * @param {Item} item
 * @param {Size} size
 */


function supportedDensity(item, size) {
  return Math.min(Math.min(Math.max(item.max.width / size.width, 1), item.density), Math.min(Math.max(item.max.height / size.height, 1), item.density)).toFixed(2);
}
/**
 * Trigger a custom event.
 *
 * Note: this approach is deprecated, but still required to support older
 * browsers such as IE 10.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
 *
 * @param {HTMLElement} el
 *        The element to trigger the event on.
 *
 * @param {String} name
 *        The event name.
 *
 * @returns {Boolean}
 *          True if the event was canceled.
 */


function trigger(el, name) {
  var event = document.createEvent('Event');
  event.initEvent(name, true, true);
  return !el.dispatchEvent(event);
}
/**
 * Set the image URL on the element. Supports background images and `srcset`.
 *
 * @param {Item} item
 * @param {Size} size
 * @param {Boolean} isPlaceholder
 */


function setImage(item, size, isPlaceholder, onLoad) {
  var render = item.templateRender;
  var density = isPlaceholder ? 1 : supportedDensity(item, size);
  var round = isPlaceholder ? 1 : item.round; // Calculate the final display size, taking into account the image's
  // maximum dimensions.

  var targetWidth = size.width * density;
  var targetHeight = size.height * density;
  var displaySize;

  if (item.crop) {
    displaySize = {
      width: roundSize(targetWidth, round, item.max.width),
      height: roundSize(targetHeight, round, item.max.height)
    };
  } else {
    // Shopify serves images clamped by the requested dimensions (fitted to the smallest dimension).
    // To get the desired and expected pixel density we need to request cover dimensions (fitted to largest dimension).
    // This isn't a problem with cropped images which are served at the exact dimension requested.
    var containerAspectRatio = size.width / size.height;
    var imageAspectRatio = item.max.width / item.max.height;

    if (containerAspectRatio > imageAspectRatio) {
      // fit width
      displaySize = {
        width: roundSize(targetWidth, round, item.max.width),
        height: roundSize(targetWidth / imageAspectRatio, round, item.max.height)
      };
    } else {
      // fit height
      displaySize = {
        width: roundSize(targetHeight * imageAspectRatio, round, item.max.width),
        height: roundSize(targetHeight, round, item.max.height)
      };
    }
  }

  var url = render(item.template, displaySize); // On load callback

  var image = new Image();
  image.onload = onLoad;
  image.src = url; // Set image

  if (item.isBackgroundImage) {
    item.el.style.backgroundImage = "url('".concat(url, "')");
  } else {
    item.el.setAttribute('srcset', "".concat(url, " ").concat(density, "x"));
  }
}
/**
 * Load the image, set loaded status, and trigger the load event.
 *
 * @fires rimg:load
 * @fires rimg:error
 * @param {Item} item
 * @param {Size} size
 */


function loadFullImage(item, size) {
  var el = item.el;
  setImage(item, size, false, function (event) {
    if (event.type === 'load') {
      el.setAttribute('data-rimg', 'loaded');
    } else {
      el.setAttribute('data-rimg', 'error');
      trigger(el, 'rimg:error');
    }

    trigger(el, 'rimg:load');
  });
}
/**
 * Load in a responsive image.
 *
 * Sets the image's `srcset` attribute to the final image URLs, calculated based
 * on the actual size the image is being shown at.
 *
 * @fires rimg:loading
 *        The image URLs have been set and we are waiting for them to load.
 *
 * @fires rimg:loaded
 *        The final image has loaded.
 *
 * @fires rimg:error
 *        The final image failed loading.
 *
 * @param {Item} item
 */


function loadImage(item) {
  var el = item.el; // Already loaded?

  var status = el.getAttribute('data-rimg');
  if (status === 'loading' || status === 'loaded') return; // Is the SVG loaded?
  // In Firefox, el.complete always returns true [citation needed, may not be the case anymore, Jan/2022]
  // so we also check el.naturalWidth, which equals 0 until the image loads

  if (!item.isBackgroundImage) {
    if (el.naturalWidth === 0 || !el.complete) {
      // Wait for the load event, then call load image
      el.addEventListener('load', function cb() {
        el.removeEventListener('load', cb);
        loadImage(item);
      });
      return;
    }
  } // Trigger loading event, and stop if cancelled


  if (trigger(el, 'rimg:loading')) return; // Mark as loading

  el.setAttribute('data-rimg', 'loading'); // Get element size. This is used as the ideal display size.

  var size = getElementSize(item.el);
  size.width *= item.scale;
  size.height *= item.scale;

  if (item.placeholder) {
    // Load a placeholder image first, followed by the full image. Force the
    // element to keep its dimensions while it loads. If the image is smaller
    // than the element size, use the image's size. Density is taken into account
    // for HiDPI devices to avoid blurry images.
    if (!item.isBackgroundImage) {
      el.setAttribute('width', Math.min(Math.floor(item.max.width / item.density), size.width));
      el.setAttribute('height', Math.min(Math.floor(item.max.height / item.density), size.height));
    }

    setImage(item, item.placeholder, true, function () {
      return loadFullImage(item, size);
    });
  } else {
    loadFullImage(item, size);
  }
}
/**
 * Prepare an element to be displayed on the screen.
 *
 * Images have special logic applied to them to swap out the different sources.
 *
 * @fires rimg:enter
 *        The element is entering the viewport.
 *
 * @param {HTMLElement} el
 * @param {Settings} options
 */


function load(el, options) {
  if (!el) return;
  trigger(el, 'rimg:enter');
  var item = parseItem(el, options);

  if (item.isImage) {
    if (!item.isBackgroundImage) {
      el.setAttribute('data-rimg-template-svg', el.getAttribute('srcset'));
    }

    loadImage(item);
  }
}
/**
 * Reset an element's state so that its image can be recalculated.
 *
 * @fires rimg:update
 *        The element is being updated.
 *
 * @param {HTMLElement} el
 * @param {Settings} options
 */


function update(el, options) {
  if (!el) return;
  trigger(el, 'rimg:update');
  var item = parseItem(el, options);

  if (item.isImage) {
    if (!item.isBackgroundImage) {
      el.setAttribute('data-rimg', 'lazy');
      el.setAttribute('srcset', el.getAttribute('data-rimg-template-svg'));
    }

    loadImage(item);
  }
}
/**
 * Returns true if the element is within the viewport.
 * @param {HTMLElement} el
 * @returns {Boolean}
 */


function inViewport(el) {
  if (!el.offsetWidth || !el.offsetHeight || !el.getClientRects().length) {
    return false;
  }

  var root = document.documentElement;
  var width = Math.min(root.clientWidth, window.innerWidth);
  var height = Math.min(root.clientHeight, window.innerHeight);
  var rect = el.getBoundingClientRect();
  return rect.bottom >= 0 && rect.right >= 0 && rect.top <= height && rect.left <= width;
}
/**
 * @typedef {Object} Size
 * @property {Number} width
 * @property {Number} height
 */

/**
 * A function to turn a template string into a URL.
 *
 * @callback TemplateRenderer
 * @param {String} template
 * @param {Size} size
 * @returns {String}
 */

/**
 * @typedef {Object} Settings
 *
 * @property {String} [template]
 *           A template string used to generate URLs for an image. This allows us to
 *           dynamically load images with sizes to match the container's size.
 *
 * @property {TemplateRenderer} [templateRender]
 *           A function to turn a template string into a URL.
 *
 * @property {Size} [max]
 *           The maximum available size for the image. This ensures we don't
 *           try to load an image larger than is possible.
 * 
 * @property {Number} [scale]
 *           A number to scale the final image dimensions by. 
 *           Only applies to lazy-loaded images. Defaults to 1.
 *
 * @property {Number} [round]
 *           Round image dimensions to the nearest multiple. This is intended to
 *           tax the image server less by lowering the number of possible image
 *           sizes requested.
 *
 * @property {Size} [placeholder]
 *           The size of the lo-fi image to load before the full image.
 * 
 * @property {String} [crop]
 *           Crop value; null if image is uncropped, otherwise equal 
 *           to the Shopify crop parameter ('center', 'top', etc.).
 */

/**
 * Initialize the responsive image handler.
 *
 * @param {String|HTMLElement|NodeList} selector
 *        The CSS selector, element, or elements to track for lazy-loading.
 *
 * @param {Settings} options
 *
 * @returns {PublicApi}
 */


function rimg() {
  var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '[data-rimg="lazy"]';
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}; // Intersections

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        io.unobserve(entry.target);
        load(entry.target, options);
      }
    });
  }, {
    // Watch the viewport, with 20% vertical margins
    rootMargin: '20% 0px'
  });
  /**
   * @typedef {Object} PublicApi
   */

  var api = {
    /**
     * Track a new selector, element, or nodelist for lazy-loading.
     * @type Function
     * @param {String|HTMLElement|NodeList} selector
     */
    track: function track() {
      var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '[data-rimg="lazy"]';
      var els = querySelector(selector);

      for (var i = 0; i < els.length; i++) {
        // If an element is already in the viewport, load it right away. This
        // fixes a race-condition with dynamically added elements.
        if (inViewport(els[i])) {
          load(els[i], options);
        } else {
          io.observe(els[i]);
        }
      }
    },

    /**
     * Update element(s) that have already been loaded to force their images
     * to be recalculated.
     * @type Function
     * @param {String|HTMLElement|NodeList} selector
     */
    update: function update$1() {
      var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '[data-rimg="loaded"]';
      var els = querySelector(selector);

      for (var i = 0; i < els.length; i++) {
        update(els[i], options);
      }
    },

    /**
     * Stop tracking element(s) for lazy-loading.
     * @type Function
     * @param {String|HTMLElement|NodeList} selector
     */
    untrack: function untrack() {
      var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '[data-rimg]';
      var els = querySelector(selector);

      for (var i = 0; i < els.length; i++) {
        io.unobserve(els[i]);
      }
    },

    /**
     * Manually load images.
     * @type Function
     * @param {String|HTMLElement|NodeList} selector
     */
    load: function load$1() {
      var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '[data-rimg]';
      var els = querySelector(selector);

      for (var i = 0; i < els.length; i++) {
        load(els[i], options);
      }
    },

    /**
     * Unload all event handlers and observers.
     * @type Function
     */
    unload: function unload() {
      io.disconnect();
    }
  }; // Add initial elements

  api.track(selector);
  return api;
}
/**
 * Finds a group of elements on the page.
 *
 * @param {String|HTMLElement|NodeList} selector
 * @returns {Object} An array-like object.
 */


function querySelector(selector) {
  if (typeof selector === 'string') {
    return document.querySelectorAll(selector);
  }

  if (selector instanceof HTMLElement) {
    return [selector];
  }

  if (selector instanceof NodeList) {
    return selector;
  }

  return [];
}

/**
 * Polyfill for Element.matches().
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
 */
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
    var matches = (this.document || this.ownerDocument).querySelectorAll(s),
        i = matches.length;

    while (--i >= 0 && matches.item(i) !== this) {}

    return i > -1;
  };
}

var state = {
  init: init,
  watch: watch,
  unwatch: unwatch,
  load: load$1
};

function init() {
  var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '[data-rimg="lazy"]';
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  state.selector = selector;
  state.instance = rimg(selector, options);
  state.loadedWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0); // Listen for Shopify theme editor events

  document.addEventListener('shopify:section:load', function (event) {
    return watch(event.target);
  });
  window.addEventListener('resize', function () {
    return _update();
  });
  document.addEventListener('shopify:section:unload', function (event) {
    return unwatch(event.target);
  }); // Listen for custom events to allow themes to hook into rimg

  document.addEventListener('theme:rimg:watch', function (event) {
    return watch(event.target);
  });
  document.addEventListener('theme:rimg:unwatch', function (event) {
    return unwatch(event.target);
  }); // Support custom events triggered through jQuery
  // See: https://github.com/jquery/jquery/issues/3347

  if (window.jQuery) {
    jQuery(document).on({
      'theme:rimg:watch': function themeRimgWatch(event) {
        return watch(event.target);
      },
      'theme:rimg:unwatch': function themeRimgUnwatch(event) {
        return unwatch(event.target);
      }
    });
  }
}
/**
 * Track an element, and its children.
 *
 * @param {HTMLElement} el
 */


function watch(el) {
  // Track element
  if (typeof el.matches === 'function' && el.matches(state.selector)) {
    state.instance.track(el);
  } // Track element's children


  state.instance.track(el.querySelectorAll(state.selector));
}
/**
 * Untrack an element, and its children
 *
 * @param {HTMLElement} el
 * @private
 */


function unwatch(el) {
  // Untrack element's children
  state.instance.untrack(el.querySelectorAll(state.selector)); // Untrack element

  if (typeof el.matches === 'function' && el.matches(state.selector)) {
    state.instance.untrack(el);
  }
}
/**
 * Manually load an image
 *
 * @param {HTMLElement} el
 */


function load$1(el) {
  // Load element
  if (typeof el.matches === 'function' && el.matches(state.selector)) {
    state.instance.load(el);
  } // Load element's children


  state.instance.load(el.querySelectorAll(state.selector));
}
/**
 * Update an element, and its children.
 *
 * @param {HTMLElement} el
 */


function _update() {
  var currentWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0); // Return if we're not 2x smaller, or larger than the existing loading size

  if (currentWidth / state.loadedWidth > 0.5 && currentWidth / state.loadedWidth < 2) {
    return;
  }

  state.loadedWidth = currentWidth;
  state.instance.update();
}

/* harmony default export */ const dist_index_es = (state);

;// CONCATENATED MODULE: ./node_modules/@pixelunion/shopify-sections-manager/dist/shopify-sections-manager.es.js

/*!
 * @pixelunion/shopify-sections-manager v1.1.0
 * (c) 2021 Pixel Union
 */

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

/**
 * Allows a callback to be run once, when a target intersects the viewport.
 * @constructor
 * @param {Object} [options] options with which to construct the IntersectionObserver
 * @param {string} [options.rootMargin='30%'] A string which specifies a set of offsets to add to
 *                                          the root's bounding_box when calculating intersections.
 * @param {number} [options.threshold=0] Ratio of intersection required to trigger callback
 */
var LazyLoader = /*#__PURE__*/function () {
  function LazyLoader(options) {
    _classCallCheck(this, LazyLoader);

    var defaultOptions = {
      rootMargin: '30%',
      threshold: 0
    };
    this.callbacks = new WeakMap();
    this._observerCallback = this._observerCallback.bind(this);
    this.observer = new IntersectionObserver(this._observerCallback, _objectSpread2(_objectSpread2({}, defaultOptions), options));
  }
  /**
   * Add target and callback. Callback is only run once.
   * @add
   * @param {HTMLElement} target Target element
   * @param {function} callback Callback to run when target begins intersecting
   */


  _createClass(LazyLoader, [{
    key: "add",
    value: function add(target, callback) {
      this.callbacks.set(target, callback);
      this.observer.observe(target);
    }
    /**
     * Remove target. Associated callback is also removed.
     * @remove
     * @param {HTMLElement} target Target element
     */

  }, {
    key: "remove",
    value: function remove(target) {
      this.observer.unobserve(target);
      this.callbacks["delete"](target);
    }
    /**
     * Disconnects IntersectionObserver if active
     * @unload
     */

  }, {
    key: "unload",
    value: function unload() {
      this.observer.disconnect();
    }
    /**
     * Runs associated callbacks for each entry, then removes that entry and callback
     * @_observerCallback
     * @param {IntersectionObserverEntry[]} entries Entries to check
     * @param {InterserctionObserver} observer IntersectionObserver instance
     */

  }, {
    key: "_observerCallback",
    value: function _observerCallback(entries, observer) {
      var _this = this;

      entries.forEach(function (_ref) {
        var isIntersecting = _ref.isIntersecting,
            target = _ref.target;

        // do nothing unless target moved into state of intersection
        if (isIntersecting === true) {
          // make sure we stop observing before running the callback, so we don't
          // somehow run the callback twice if element intersects twice quickly
          observer.unobserve(target);

          var callback = _this.callbacks.get(target);

          if (typeof callback === 'function') {
            callback();
          }

          _this.callbacks["delete"](target);
        }
      });
    }
  }]);

  return LazyLoader;
}();

function triggerInstanceEvent(instance, eventName) {
  if (instance && instance[eventName]) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    instance[eventName].apply(instance, args);
  }
}

function loadData(el) {
  var dataEl = el.querySelector('[data-section-data]');
  if (!dataEl) return {}; // Load data from attribute, or innerHTML

  var data = dataEl.getAttribute('data-section-data') || dataEl.innerHTML;

  try {
    return JSON.parse(data);
  } catch (error) {
    console.warn("Sections: invalid section data found. ".concat(error.message));
    return {};
  }
}

var ShopifySectionsManager = /*#__PURE__*/function () {
  function ShopifySectionsManager() {
    _classCallCheck(this, ShopifySectionsManager);

    this.handlers = {};
    this.instances = {};
    this.options = {};
    this.lazyLoader = null;
    this._onSectionEvent = this._onSectionEvent.bind(this);
    document.addEventListener('shopify:section:load', this._onSectionEvent);
    document.addEventListener('shopify:section:unload', this._onSectionEvent);
    document.addEventListener('shopify:section:select', this._onSectionEvent);
    document.addEventListener('shopify:section:deselect', this._onSectionEvent);
    document.addEventListener('shopify:section:reorder', this._onSectionEvent);
    document.addEventListener('shopify:block:select', this._onSectionEvent);
    document.addEventListener('shopify:block:deselect', this._onSectionEvent);
  }
  /**
   * Stop listening for section events, and unbind all handlers.
   */


  _createClass(ShopifySectionsManager, [{
    key: "unbind",
    value: function unbind() {
      document.removeEventListener('shopify:section:load', this._onSectionEvent);
      document.removeEventListener('shopify:section:unload', this._onSectionEvent);
      document.removeEventListener('shopify:section:select', this._onSectionEvent);
      document.removeEventListener('shopify:section:deselect', this._onSectionEvent);
      document.removeEventListener('shopify:section:reorder', this._onSectionEvent);
      document.removeEventListener('shopify:block:select', this._onSectionEvent);
      document.removeEventListener('shopify:block:deselect', this._onSectionEvent); // Unload all instances

      for (var i = 0; i < this.instances.length; i++) {
        triggerInstanceEvent(this.instances[i], 'onSectionUnload');
      }

      this.handlers = {};
      this.options = {};
      this.lazyLoader.unload();
      this.lazyLoader = null;
      this.instances = {};
    }
    /**
     * Register a section handler.
     *
     * @param {string} type
     *        The section type to handle. The handler will be called for all
     *        sections with this type.
     *
     * @param {function} handler
     *        The handler function is passed information about a specific section
     *        instance. The handler is expected to return an object that will be
     *        associated with the section instance.
     *
     *        Section handlers are passed an object with the following parameters:
     *          {string} id
     *          An ID that maps to a specific section instance. Typically the
     *          section's filename for static sections, or a generated ID for
     *          dynamic sections.
     *
     *          {string} type
     *          The section type, as supplied when registered.
     *
     *          {Element} el
     *          The root DOM element for the section instance.
     *
     *          {Object} data
     *          Data loaded from the section script element. Defaults to an
     *          empty object.
     *
     *          {Function} postMessage
     *          A function that can be called to pass messages between sections.
     *          The function should be called with a message "name", and
     *          optionally some data.
     *
     * @param {object} options
     *
     * @param {boolean} options.lazy
     *     If true, sections will only be initialized after they intersect the viewport + 30% margin
     */

  }, {
    key: "register",
    value: function register(type, handler) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (this.handlers[type]) {
        console.warn("Sections: section handler already exists of type '".concat(type, "'."));
      } // Store the section handler


      this.handlers[type] = handler; // Store options

      this.options[type] = options; // Init sections for this type

      this._initSections(type);
    }
    /**
     * Initialize sections already on the page.
     */

  }, {
    key: "_initSections",
    value: function _initSections(type) {
      var _this = this;

      // Fetch all existing sections of our type on the page
      var dataEls = document.querySelectorAll("[data-section-type=\"".concat(type, "\"]"));
      if (!dataEls) return; // Create an instance for each section

      var _loop = function _loop(i) {
        var dataEl = dataEls[i];
        var el = dataEl.parentNode; // Get instance ID

        var idEl = el.querySelector('[data-section-id]');

        if (!idEl) {
          console.warn("Sections: unable to find section id for '".concat(type, "'."), el);
          return {
            v: void 0
          };
        }

        var sectionId = idEl.getAttribute('data-section-id');

        if (!sectionId) {
          console.warn("Sections: unable to find section id for '".concat(type, "'."), el);
          return {
            v: void 0
          };
        }

        if (_this.options[type] && _this.options[type].lazy) {
          if (_this.lazyLoader === null) {
            _this.lazyLoader = new LazyLoader();
          }

          _this.lazyLoader.add(el, function () {
            return _this._createInstance(sectionId, el);
          });
        } else {
          _this._createInstance(sectionId, el);
        }
      };

      for (var i = 0; i < dataEls.length; i++) {
        var _ret = _loop(i);

        if (_typeof(_ret) === "object") return _ret.v;
      }
    }
  }, {
    key: "_onSectionEvent",
    value: function _onSectionEvent(event) {
      var el = event.target;
      var _event$detail = event.detail,
          sectionId = _event$detail.sectionId,
          blockId = _event$detail.blockId;
      var instance = this.instances[sectionId];

      switch (event.type) {
        case 'shopify:section:load':
          this._createInstance(sectionId, el);

          break;

        case 'shopify:section:unload':
          triggerInstanceEvent(instance, 'onSectionUnload', {
            el: el,
            id: sectionId
          });

          if (this.lazyLoader) {
            this.lazyLoader.remove(el);
          }

          delete this.instances[sectionId];
          break;

        case 'shopify:section:select':
          triggerInstanceEvent(instance, 'onSectionSelect', {
            el: el,
            id: sectionId
          });
          break;

        case 'shopify:section:deselect':
          triggerInstanceEvent(instance, 'onSectionDeselect', {
            el: el,
            id: sectionId
          });
          break;

        case 'shopify:section:reorder':
          triggerInstanceEvent(instance, 'onSectionReorder', {
            el: el,
            id: sectionId
          });
          break;

        case 'shopify:block:select':
          triggerInstanceEvent(instance, 'onSectionBlockSelect', {
            el: el,
            id: blockId
          });
          break;

        case 'shopify:block:deselect':
          triggerInstanceEvent(instance, 'onSectionBlockDeselect', {
            el: el,
            id: blockId
          });
          break;
      }
    }
  }, {
    key: "_postMessage",
    value: function _postMessage(name, data) {
      var _this2 = this;

      Object.keys(this.instances).forEach(function (id) {
        triggerInstanceEvent(_this2.instances[id], 'onSectionMessage', name, data);
      });
    }
  }, {
    key: "_createInstance",
    value: function _createInstance(id, el) {
      var typeEl = el.querySelector('[data-section-type]');
      if (!typeEl) return;
      var type = typeEl.getAttribute('data-section-type');
      if (!type) return;
      var handler = this.handlers[type];

      if (!handler) {
        console.warn("Sections: unable to find section handler for type '".concat(type, "'."));
        return;
      }

      var data = loadData(el);

      var postMessage = this._postMessage.bind(this);

      this.instances[id] = handler({
        id: id,
        type: type,
        el: el,
        data: data,
        postMessage: postMessage
      });
    }
  }]);

  return ShopifySectionsManager;
}();

/* harmony default export */ const shopify_sections_manager_es = (ShopifySectionsManager);

;// CONCATENATED MODULE: ./node_modules/@pixelunion/age-gate/dist/index.es.js

/*!
 * @pixelunion/age-gate v1.1.0
 * (c) 2023 Pixel Union
 */

function index_es_classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function index_es_defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function index_es_createClass(Constructor, protoProps, staticProps) {
  if (protoProps) index_es_defineProperties(Constructor.prototype, protoProps);
  if (staticProps) index_es_defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

var scrollLock = __webpack_require__(265);
var isbot = __webpack_require__(616);
function getAge(birthdate) {
  var today = new Date();
  var age = today.getFullYear() - birthdate.getFullYear();
  var m = today.getMonth() - birthdate.getMonth();
  if (m < 0 || m === 0 && today.getDate() < birthdate.getDate()) {
    age--;
  }
  return age;
}
var SiteAgeGate = /*#__PURE__*/function () {
  function SiteAgeGate(el) {
    index_es_classCallCheck(this, SiteAgeGate);
    this._el = el;
    this._ageGateForm = el.querySelector('[data-age-gate]');
    this._ageGateErrorEl = this._ageGateForm.querySelector('[data-age-gate-error]');
    this._requiredAge = this._ageGateForm.dataset.requiredAge;
    this._el.addEventListener('age-gate:open', this._open.bind(this));
    this._el.addEventListener('age-gate:close', this._close.bind(this));
    this._ageGateForm.addEventListener('submit', this._onFormSubmit.bind(this));
    if (isbot(navigator.userAgent)) {
      this._close();
    } else if (this._el.style.display === '') {
      this._open();
    }
  }
  index_es_createClass(SiteAgeGate, [{
    key: "_open",
    value: function _open() {
      scrollLock.disablePageScroll();
      this._el.style.display = '';
    }
  }, {
    key: "_close",
    value: function _close() {
      scrollLock.enablePageScroll();
      this._el.style.display = 'none';
    }
  }, {
    key: "_onFormSubmit",
    value: function _onFormSubmit(event) {
      event.preventDefault();
      event.stopPropagation();
      var data = new FormData(event.target);
      var day = data.get('day');
      var month = data.get('month');
      var year = data.get('year');
      if (day === '' || month === '' || year === '') return;
      var age = getAge(new Date(year, month, day));
      if (age >= this._requiredAge) {
        this._close();
        sessionStorage.setItem('age-gate', age);
      } else {
        this._ageGateErrorEl.style.display = '';
      }
    }
  }]);
  return SiteAgeGate;
}();

var PageAgeGate = /*#__PURE__*/function () {
  function PageAgeGate() {
    index_es_classCallCheck(this, PageAgeGate);
    this._ageGateEl = document.getElementById('age-gate-page');
  }
  index_es_createClass(PageAgeGate, [{
    key: "onSectionLoad",
    value: function onSectionLoad() {
      var openEvent = new CustomEvent('age-gate:open');
      this._ageGateEl.dispatchEvent(openEvent);
    }
  }, {
    key: "onSectionSelect",
    value: function onSectionSelect() {
      var openEvent = new CustomEvent('age-gate:open');
      this._ageGateEl.dispatchEvent(openEvent);
    }
  }, {
    key: "onSectionDeselect",
    value: function onSectionDeselect() {
      var closeEvent = new CustomEvent('age-gate:close');
      this._ageGateEl.dispatchEvent(closeEvent);
    }
  }]);
  return PageAgeGate;
}();



;// CONCATENATED MODULE: ./node_modules/@shopify/theme-addresses/theme-addresses.js
/**
 * CountryProvinceSelector Constructor
 * @param {String} countryOptions the country options in html string
 */
function CountryProvinceSelector(countryOptions) {
  if (typeof countryOptions !== 'string') {
    throw new TypeError(countryOptions + ' is not a string.');
  }
  this.countryOptions = countryOptions;
}

/**
 * Builds the country and province selector with the given node element
 * @param {Node} countryNodeElement The <select> element for country
 * @param {Node} provinceNodeElement The <select> element for province
 * @param {Object} options Additional settings available
 * @param {CountryProvinceSelector~onCountryChange} options.onCountryChange callback after a country `change` event
 * @param {CountryProvinceSelector~onProvinceChange} options.onProvinceChange callback after a province `change` event
 */
CountryProvinceSelector.prototype.build = function (countryNodeElement, provinceNodeElement, options) {
  if (typeof countryNodeElement !== 'object') {
    throw new TypeError(countryNodeElement + ' is not a object.');
  }

  if (typeof provinceNodeElement !== 'object') {
    throw new TypeError(provinceNodeElement + ' is not a object.');
  }

  var defaultValue = countryNodeElement.getAttribute('data-default');
  options = options || {}

  countryNodeElement.innerHTML = this.countryOptions;
  countryNodeElement.value = defaultValue;

  if (defaultValue && getOption(countryNodeElement, defaultValue)) {
    var provinces = buildProvince(countryNodeElement, provinceNodeElement, defaultValue);
    options.onCountryChange && options.onCountryChange(provinces, provinceNodeElement, countryNodeElement);
  }

  // Listen for value change on the country select
  countryNodeElement.addEventListener('change', function (event) {
    var target = event.target;
    var selectedValue = target.value;
    
    var provinces = buildProvince(target, provinceNodeElement, selectedValue);
    options.onCountryChange && options.onCountryChange(provinces, provinceNodeElement, countryNodeElement);
  });

  options.onProvinceChange && provinceNodeElement.addEventListener('change', options.onProvinceChange);
}

/**
 * This callback is called after a user interacted with a country `<select>`
 * @callback CountryProvinceSelector~onCountryChange
 * @param {array} provinces the parsed provinces
 * @param {Node} provinceNodeElement province `<select>` element
 * @param {Node} countryNodeElement country `<select>` element
 */

 /**
 * This callback is called after a user interacted with a province `<select>`
 * @callback CountryProvinceSelector~onProvinceChange
 * @param {Event} event the province selector `change` event object
 */

/**
 * Returns the <option> with the specified value from the
 * given node element
 * A null is returned if no such <option> is found
 */
function getOption(nodeElement, value) {
  return nodeElement.querySelector('option[value="' + value +'"]')
}

/**
 * Builds the options for province selector
 */
function buildOptions (provinceNodeElement, provinces) {
  var defaultValue = provinceNodeElement.getAttribute('data-default');

  provinces.forEach(function (option) {
    var optionElement = document.createElement('option');
    optionElement.value = option[0];
    optionElement.textContent = option[1];

    provinceNodeElement.appendChild(optionElement);
  })

  if (defaultValue && getOption(provinceNodeElement, defaultValue)) {
    provinceNodeElement.value = defaultValue;
  }
}

/**
 * Builds the province selector
 */
function buildProvince (countryNodeElement, provinceNodeElement, selectedValue) {
  var selectedOption = getOption(countryNodeElement, selectedValue);
  var provinces = JSON.parse(selectedOption.getAttribute('data-provinces'));

  provinceNodeElement.options.length = 0;

  if (provinces.length) {
    buildOptions(provinceNodeElement, provinces)
  }

  return provinces;
}

// EXTERNAL MODULE: ./node_modules/@pixelunion/events/dist/EventHandler.js
var EventHandler = __webpack_require__(766);
;// CONCATENATED MODULE: ./source/scripts/utilities/ShippingCalculator.js



class ShippingCalculator {
  constructor({ el }) {
    this.el = el;
    this.events = new EventHandler/* default */.Z();
    this.rates = this.el.querySelector('[data-shipping-rates]');
    this.message = this.el.querySelector('[data-shipping-message]');
    this.zip = this.el.querySelector('[data-shipping-calculator-zipcode]');
    this.submit = this.el.querySelector('.get-rates');
    this.response = this.el.querySelector('[data-shipping-calculator-response]');
    this.countrySelect = this.el.querySelector('[data-shipping-calculator-country]');
    this.provinceSelect = this.el.querySelector('[data-shipping-calculator-province]');
    this.provinceContainer = this.el.querySelector('[data-shipping-calculator-province-container]');

    this.buildCalculator();
  }

  buildCalculator() {
    this.shippingCountryProvinceSelector = new CountryProvinceSelector(this.countrySelect.innerHTML);
    this.shippingCountryProvinceSelector
      .build(
        this.countrySelect,
        this.provinceSelect,
        {
          onCountryChange: provinces => {
            if (provinces.length) {
              this.provinceContainer.style.display = 'block';
            } else {
              this.provinceContainer.style.display = 'none';
            }

            // "Province", "State", "Region", etc. and "Postal Code", "ZIP Code", etc.
            // Even countries without provinces include a label.
            const { label, zip_label: zipLabel } = window.Countries[this.countrySelect.value];
            this.provinceContainer.querySelector('label[for="address_province"]').innerHTML = label;
            this.el.querySelector('label[for="address_zip"]').innerHTML = zipLabel;
          },
        },
      );

    this.events.register(this.submit, 'click', e => {
      e.preventDefault();
      this.getRates();
    });
  }

  getRates() {
    const shippingAddress = {};
    shippingAddress.country = this.countrySelect ? this.countrySelect.value : '';
    shippingAddress.province = this.provinceSelect ? this.provinceSelect.value : '';
    shippingAddress.zip = this.zip ? this.zip.value : '';

    const queryString = Object.keys(shippingAddress)
      .map(key => `${encodeURIComponent(`shipping_address[${key}]`)}=${encodeURIComponent(shippingAddress[key])}`)
      .join('&');

    fetch(`${window.PXUTheme.routes.cart_url}/shipping_rates.json?${queryString}`)
      .then(response => response.json())
      .then(data => this.displayRates(data));
  }

  displayRates(rates) {
    const propertyName = Object.keys(rates);
    this.clearRates();

    if (propertyName[0] === 'shipping_rates') {
      rates.shipping_rates.forEach(rate => {
        const rateLi = document.createElement('li');
        rateLi.innerHTML = `${rate.name}: ${this.formatPrice(rate.price)}`;
        this.rates.appendChild(rateLi);
      });

      if (rates.shipping_rates.length > 1) {
        this.message.innerHTML = `${window.PXUTheme.translation.additional_rates_part_1} ${rates.shipping_rates.length} ${window.PXUTheme.translation.additional_rates_part_2} ${this.zip.value}, ${this.provinceSelect.value}, ${this.countrySelect.value}, ${window.PXUTheme.translation.additional_rates_part_3} ${this.formatPrice(rates.shipping_rates[0].price)}`;
      } else {
        this.message.innerHTML = `${window.PXUTheme.translation.additional_rate} ${this.zip.value}, ${this.provinceSelect.value}, ${this.countrySelect.value}, ${window.PXUTheme.translation.additional_rate_at} ${this.formatPrice(rates.shipping_rates[0].price)}`;
      }

      this.response.classList.add('shipping-rates--display-rates');
    } else {
      this.message.innerHTML = `Error: ${propertyName[0]} ${rates[propertyName[0]]}`;
      this.response.classList.add('shipping-rates--display-error');
    }
  }

  clearRates() {
    this.response.classList.remove('shipping-rates--display-error', 'shipping-rates--display-rates');
    this.message.innerHTML = '';
    this.rates.innerHTML = '';
  }

  formatPrice(price) {
    let formattedPrice;

    if (window.PXUTheme.currency.display_format === 'money_with_currency_format') {
      formattedPrice = `<span class="money">${window.PXUTheme.currency.symbol}${price} ${window.PXUTheme.currency.iso_code}</span>`;
    } else {
      formattedPrice = `<span class="money">${window.PXUTheme.currency.symbol}${price}</span>`;
    }

    return formattedPrice;
  }

  unload() {
    this.events.unregisterAll();
  }
}

;// CONCATENATED MODULE: ./source/scripts/app.js






dist_index_es.init('[data-rimg="lazy"]', { round: 1 });

const sections = new shopify_sections_manager_es();

sections.register('age-gate', section => new PageAgeGate(section));

const ageGatePage = document.getElementById('age-gate-page');

if (ageGatePage) {
  new SiteAgeGate(ageGatePage);
}

// Section Shopify window.PXUTheme.theme editor events

$(document)
.on('shopify:section:reorder', function(e){

  var $target = $(e.target);
  var $parentSection = $('#shopify-section-' + e.detail.sectionId);

  if (window.PXUTheme.jsHeader.enable_overlay == true) {
    window.PXUTheme.jsHeader.unload();
    window.PXUTheme.jsHeader.updateOverlayStyle(window.PXUTheme.jsHeader.sectionUnderlayIsImage());
  }

});

$(document)
.on('shopify:section:load', function(e){
  // Shopify section as jQuery object
  var $section = $(e.target);

  // Vanilla js selection of Shopify section
  var section = document.getElementById('shopify-section-' + e.detail.sectionId);

  // Blocks within section
  var $jsSectionBlocks = $section.find('.shopify-section[class*=js]');

  var sectionObjectUrl = $section.find('[data-theme-editor-load-script]').attr('src');

  // Check classes on schema and look for js (eg. jsMap)
  for (var i = 0; i < section.classList.length; i++) {
    if (section.classList[i].substring(0, 2) === "js"){
      var triggerClass = section.classList[i];

      // Check to see if section script exists
      if (typeof window.PXUTheme[triggerClass] == 'undefined') {
        // make AJAX call to load script
        window.PXUTheme.loadScript(triggerClass, sectionObjectUrl, function () {
          window.PXUTheme[triggerClass].init($(section));
        });
      } else {
        if (window.PXUTheme[triggerClass]) {
          // console.log('Section: ' + triggerClass + ' has been loaded.')
          window.PXUTheme[triggerClass].init($(section));
        } else {
          // console.warn('Uh oh, ' + triggerClass + ' is referenced in section schema class, but can not be found. Make sure "z__' + triggerClass + '.js" and window.PXUTheme.' + triggerClass + '.init() function exists.');
        }
      }
    }
  }

  // Check classes on block element and look for js (eg. jsMap)
  if ($jsSectionBlocks.length > 0) {
    var $jsSectionBlockNames = $jsSectionBlocks.each(function () {
      for (var i = 0; i < this.classList.length; i++) {
        if (this.classList[i].substring(0, 2) === "js") {
          var triggerClass = this.classList[i];
          var $block = $('.'+ triggerClass)
          var blockUrl = $block.find('[data-theme-editor-load-script]').attr('src');

          // Check to see if section script exists
          if (typeof window.PXUTheme[triggerClass] == 'undefined') {
            // make AJAX call to load script
            window.PXUTheme.loadScript(triggerClass, blockUrl, function () {
              window.PXUTheme[triggerClass].init($block);
            });
          } else {
            if (window.PXUTheme[triggerClass]) {
              // console.log('Block: ' + triggerClass + ' has been loaded.')
              window.PXUTheme[triggerClass].init($(this));
            } else {
              // console.warn('Uh oh, ' + triggerClass + ' is referenced in block class, but can not be found. Make sure "z__' + triggerClass + '.js" and window.PXUTheme.' + triggerClass + '.init() function exists.');
            }
          }

        }
      }
    });
  }

  // Load video feature
  window.PXUTheme.video.init();

  // Scrolling animations
  window.PXUTheme.animation.init();

  // Initialize reviews
  window.PXUTheme.productReviews.init();

  // Infinite scrolling
  window.PXUTheme.infiniteScroll.init();

  // Disclosure menus
  window.PXUTheme.disclosure.enable();

  // Search
  if (window.PXUTheme.theme_settings.enable_autocomplete == true) {
    window.PXUTheme.predictiveSearch.init();
  }
  // Product review scroll
  window.PXUTheme.productReviews.productReviewScroll();

});


$(document)
.on('shopify:section:unload', function(e){

  // Shopify section as jQuery object
  var $section = $(e.target);

  // Vanilla js selection of Shopify section
  var section = document.getElementById('shopify-section-' + e.detail.sectionId);

  // Blocks within section
  var $jsSectionBlocks = $section.find('.shopify-section[class*=js]');

  // Check classes on schema and look for js (eg. jsMap)
  for (var i = 0; i < section.classList.length; i++) {
    if (section.classList[i].substring(0, 2) === "js"){
      var triggerClass = section.classList[i];
      if (window.PXUTheme[triggerClass]) {
        // console.log('Section: ' + triggerClass + ' is unloaded.')
        window.PXUTheme[triggerClass].unload($(section));
      } else {
        // console.warn('Uh oh, ' + triggerClass + ' is referenced in section schema class, but can not be found. Make sure "z__' + triggerClass + '.js" and window.PXUTheme.' + triggerClass + '.unload() function exists.');
      }
    }
  }

  // Check classes on block element and look for js (eg. jsMap)
  if ($jsSectionBlocks.length > 0) {
    var $jsSectionBlockNames = $jsSectionBlocks.each(function () {
      for (var i = 0; i < this.classList.length; i++) {
        if (this.classList[i].substring(0, 2) === "js") {
          var triggerClass = this.classList[i];
          if (window.PXUTheme[triggerClass]) {
            // console.log('Block: ' + triggerClass + ' is unloaded.')
            window.PXUTheme[triggerClass].unload($(this));
          } else {
            // console.warn('Uh oh, ' + triggerClass + ' is referenced in block class, but can not be found. Make sure "z__' + triggerClass + '.js" and window.PXUTheme.' + triggerClass + '.unload() function exists.');
          }

        }
      }
    });
  }

  // Scrolling animations
  window.PXUTheme.animation.unload($section);

  // QuantityBox
  window.PXUTheme.quantityBox.unload($section);

  // Infinite scrolling
  window.PXUTheme.infiniteScroll.unload($section);

  // Disclosure menus
  window.PXUTheme.disclosure.enable();

});

$(document)
.on('shopify:section:select', function(e){

  // Shopify section as jQuery object
  var $section = $(e.target);

  // Vanilla js selection of Shopify section
  var section = document.getElementById('shopify-section-' + e.detail.sectionId);

  // Force show state when section is selected in theme editor
  for (var i = 0; i < section.classList.length; i++) {
    if (section.classList[i].substring(0, 2) === "js") {
      var triggerClass = section.classList[i];
      if (window.PXUTheme[triggerClass].showThemeEditorState) {
        window.PXUTheme[triggerClass].showThemeEditorState(e.detail.sectionId, $section);
      }
    }
  }

  // Predictive search
  if (window.PXUTheme.theme_settings.enable_autocomplete == true) {
    window.PXUTheme.predictiveSearch.init();
  }

  if($('.tabs').length > 0) {
    window.PXUTheme.tabs.enableTabs();
  }

  if(isScreenSizeLarge() && window.PXUTheme.jsHeader.enable_overlay === true) {
    window.PXUTheme.jsHeader.updateOverlayStyle(window.PXUTheme.jsHeader.sectionUnderlayIsImage());
  }

  if ($('.block__recommended-products').length > 0) {
    var $productPage = $('.block__recommended-products').parents('.product-page');
    window.PXUTheme.jsRecommendedProducts.init($productPage);
  }

});

$(document)
.on('shopify:section:deselect', function(e){

  // Shopify section as jQuery object
  var $section = $(e.target);

  // Vanilla js selection of Shopify section
  var section = document.getElementById('shopify-section-' + e.detail.sectionId);

  // Force hide state when section is selected in theme editor
  for (var i = 0; i < section.classList.length; i++) {
    if (section.classList[i].substring(0, 2) === "js") {
      var triggerClass = section.classList[i];
      if (window.PXUTheme[triggerClass].showThemeEditorState) {
        window.PXUTheme[triggerClass].hideThemeEditorState(e.detail.sectionId, $(section));
      }
    }
  }

});

// Block Shopify window.PXUTheme.theme editor events

$(document)
.on('shopify:block:select', function(e){

  var blockId = e.detail.blockId;
  var $parentSection = $('#shopify-section-' + e.detail.sectionId);
  var $block = $('#shopify-section-' + blockId);

  if($('.jsFeaturedPromos').length > 0) {
    window.PXUTheme.jsFeaturedPromos.blockSelect($parentSection, blockId);
  }

  if($('.jsSlideshowWithText').length > 0) {
    window.PXUTheme.jsSlideshowWithText.blockSelect($parentSection, blockId);
  }

  if ($('.jsSlideshowClassic').length > 0) {
    window.PXUTheme.jsSlideshowClassic.blockSelect($parentSection, blockId);
  }

  if($('.jsTestimonials').length > 0) {
    window.PXUTheme.jsTestimonials.blockSelect($parentSection, blockId);
  }

  if ($('.jsGrid').length > 0) {
    window.PXUTheme.jsGrid.blockSelect($parentSection, blockId);
  }

  // Sidebar collection multi-tag filter
  if ($block.hasClass('sidebar__block')) {
    var $toggleBtn = $block.find('[data-sidebar-block__toggle="closed"]');
    if ($toggleBtn) {
      window.PXUTheme.jsSidebar.openSidebarBlock($toggleBtn);
    }
  }

  // Predictive search
  if (window.PXUTheme.theme_settings.enable_autocomplete == true) {
    window.PXUTheme.predictiveSearch.init();
  }

  // Scrolling animations
  window.PXUTheme.animation.init();
});

$(document)
.on('shopify:block:deselect', function(e){

  var $block = $('#shopify-section-' + e.detail.blockId);

  if ($block.hasClass('sidebar__block')) {
    var $toggleBtn = $block.find('[data-sidebar-block__toggle="open"]');
    if ($toggleBtn) {
      window.PXUTheme.jsSidebar.closeSidebarBlock($toggleBtn);
    }
  }

});

$(document)
.on('shopify:block:load', function(e){



});

// Window ready
$(window).on('load', function() {
  var $jsSections = $('.shopify-section[class*=js]');

  // Loop through sections with js classes and load them in
  var $jsSectionNames = $jsSections.each(function () {
    for (var i = 0; i < this.classList.length; i++) {
      if (this.classList[i].substring(0, 2) === "js"){
        var triggerClass = this.classList[i];
        if (window.PXUTheme[triggerClass]) {
          // console.log('Section: ' + triggerClass + ' has been loaded.')
          window.PXUTheme[triggerClass].init($(this));
        } else {
          // console.warn('Uh oh, ' + triggerClass + ' is referenced in section schema class, but can not be found. Make sure "z__' + triggerClass + '.js" and window.PXUTheme.' + triggerClass + '.init() function exists.');
        }

      }
    }
  });

  var resizeTimer;

  // Store window width in variable
  var width = $(window).width(), height = $(window).height();

  $(window).on('resize', function(e) {

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {

      if (!isScreenSizeLarge()){
        // When 798 or less
        window.PXUTheme.mobileMenu.init();
      } else {
        // When larger than 798
        window.PXUTheme.mobileMenu.unload();
      }

    }, 250);

  });

  //Enable plyr
  window.PXUTheme.video.init();

  // Predictive search
  if (window.PXUTheme.theme_settings.enable_autocomplete == true) {
    window.PXUTheme.predictiveSearch.init();
  }

  window.PXUTheme.dropdownMenu();

  window.PXUTheme.disclosure.enable();

  // Scrolling animations
  window.PXUTheme.animation.init();

  // QuantityBox
  window.PXUTheme.quantityBox.init();

  /* Show associated variant image on hover */
  if (window.PXUTheme.theme_settings.show_collection_swatches == true) {
    window.PXUTheme.thumbnail.enableSwatches();
  }

  /* Show secondary image on hover */
  if (window.PXUTheme.theme_settings.show_secondary_image == true) {
    window.PXUTheme.thumbnail.showVariantImage();
  }

  // Quick shop
  if (window.PXUTheme.theme_settings.enable_quickshop) {
    window.PXUTheme.thumbnail.showQuickShop();
  }

  // Currency converter
  if (window.PXUTheme.currencyConverter) {
    window.PXUTheme.currencyConverter.init();
  }

  //Infinite scrolling
  if ($('[data-custom-pagination]').length) {
    window.PXUTheme.infiniteScroll.init();
  }

  //Select event for native multi currency checkout
  $('.shopify-currency-form select').on('change', function () {
    $(this)
      .parents('form')
      .submit();
  });

  // Tabs
  if($('.tabs').length > 0) {
    window.PXUTheme.tabs.enableTabs();
  }

  // Additional checkout buttons
  if (!isScreenSizeLarge()) {
    $('.additional-checkout-buttons').addClass('additional-checkout-buttons--vertical');
  }

  // Accordion
  if($('.accordion, [data-cc-accordion]').length > 0) {
    window.PXUTheme.contentCreator.accordion.init();
  }

  // Backwards compatiblity for Flexslider
  if($('.slider, .flexslider').length > 0) {
    window.PXUTheme.contentCreator.slideshow.init();
  }

  // Responsive Video
  window.PXUTheme.responsiveVideo.init();

  // Flickity IOS Fix
  window.PXUTheme.flickityIosFix();

  // Product review scroll
  window.PXUTheme.productReviews.productReviewScroll();

  if (window.PXUTheme.theme_settings.shipping_calculator_enabled && document.querySelector('[data-shipping-calculator]')) {
    const shippingCalculator = new ShippingCalculator({ el: document.querySelector('[data-shipping-calculator]') });
  }

  // Scroll after CAPTCHA challenge for newsletter/customer form submission.
  // When not having to do the CAPTCHA challenge, the page scrolls to the form that was initially used
  // for submitting without requiring any JS. The checks below are so that that behaviour gets preserved.
  const contactFormHashes = ['#footer_contact_form', '#section_contact_form', '#password_contact_form', '#sidebar_contact_form'];
  const searchParams = new URLSearchParams(window.location.search);
  const customerPosted = searchParams.get('customer_posted');
  const hasHash = contactFormHashes.includes(window.location.hash);

  if (customerPosted === 'true' && !hasHash) {
    const el = document.querySelector('.newsletter-section') || document.querySelector('.block__newsletter');
    if (el) el.scrollIntoView();
  }
});

/*============================================================================
Slideshow arrows
==============================================================================*/

if (window.PXUTheme.theme_settings.icon_style == 'icon_solid') {
  window.arrowShape = 'M95.04 46 21.68 46 48.18 22.8 42.91 16.78 4.96 50 42.91 83.22 48.18 77.2 21.68 54 95.04 54 95.04 46z';
} else {
  window.arrowShape = 'M95,48H9.83L41,16.86A2,2,0,0,0,38.14,14L3.59,48.58a1.79,1.79,0,0,0-.25.31,1.19,1.19,0,0,0-.09.15l-.1.2-.06.2a.84.84,0,0,0,0,.17,2,2,0,0,0,0,.78.84.84,0,0,0,0,.17l.06.2.1.2a1.19,1.19,0,0,0,.09.15,1.79,1.79,0,0,0,.25.31L38.14,86A2,2,0,0,0,41,86a2,2,0,0,0,0-2.83L9.83,52H95a2,2,0,0,0,0-4Z';
}

})();

/******/ })()
;