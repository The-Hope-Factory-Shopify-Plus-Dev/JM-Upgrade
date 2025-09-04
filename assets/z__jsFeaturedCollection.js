/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
window.PXUTheme.jsFeaturedCollection = {
  init: function($section) {
    // Add settings from schema to current object
    window.PXUTheme.jsFeaturedCollection = $.extend(this, window.PXUTheme.getSectionData($section));

    if (this.collection_layout == 'slider') {
      this.createSlider('.slider-gallery--desktop');
    }

    if (this.collection_layout_mobile == 'slider') {
      this.createSlider('.slider-gallery--mobile');
    }
  },
  createSlider: function(el) {
    const slider = $(el);
     const slideData = {
      products_per_slide: this.products_per,
      products_available: this.products_available,
      products_limit: this.products_limit,
      cellAlign: "left",
      wrapAround: false
    }
    $(slider).flickity({
      lazyLoad: 2,
      freeScroll: true,
      imagesLoaded: true,
      draggable: true,
      cellAlign: 'center',
      wrapAround: slideData.wrapAround,
      pageDots: false,
      contain: true,
      prevNextButtons: this.products_limit > this.products_per ? true : false,
      initialIndex: 0,
      arrowShape: arrowShape,
    });

    $(slider).on('settle.flickity', () => $(slider).flickity('resize'));
  },
  unload: function($section) {
    let $slider = $section.find('.flickity-enabled');
    $slider.flickity('destroy');
  }
}

/******/ })()
;