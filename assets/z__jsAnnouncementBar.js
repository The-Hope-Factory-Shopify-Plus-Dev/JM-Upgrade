/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
window.PXUTheme.jsAnnouncementBar = {
  init: function($section){

    // Add settings from schema to current object
    window.PXUTheme.jsAnnouncementBar = $.extend(this, window.PXUTheme.getSectionData($section));

    let template = this.homepage_only ? '.index' : '';
    this.$el = $('#announcement-bar', template);
    let announcementCookie = Cookies.get('announcement-bar');
    $('.announcement-bar__shadow').height(this.$el.height());

    if (this.show_close_icon === false) {
      // Close icon is disabled, always show announcement
      Cookies.remove('announcement-bar');
      $('body').addClass('announcement-bar--visible');
    } else if (announcementCookie !== 'dismiss') {
      // Close icon has not been clicked
      $('body').addClass('announcement-bar--visible');
    } else {
      // Close icon has been clicked and announcement is hidden
      $('body').addClass('announcement-bar--hidden');
      this.disableSticky();
      return false;
    }

    // Sticky announcement bar
    if (this.enable_sticky === true) {
      this.enableSticky();
    } else {
      this.disableSticky();
    }

    // Hide announcement by default, but then hide or show based on close icon status
    if (this.show_close_icon === true) {
      $('body').addClass('has-announcement-bar-toggle');

      // Attach event to hide announcement if close icon is clicked
      this.$el.on('click', '.js-close-announcement', () => {
        this.hide();
      });
    }
       const $annocumentSlider = $section.find('.announcement_carousel');

      const $headerannocumentSlider = $annocumentSlider.flickity({
        contain: true,
        percentPosition: true,
        wrapAround: true,
        prevNextButtons: false,
        pageDots: false,
        autoPlay: true,
        pauseAutoPlayOnHover: true
      });
  
      $headerannocumentSlider.on( 'settle.flickity', function() {
        $headerannocumentSlider.flickity('resize');
      });
  },
  enableSticky: function() {
    // Add sticky functionality and recalculate offset for header sticky
    this.$el.parent().sticky({
      wrapperClassName: 'announcement-sticky-wrapper',
    })

    this.resetHeader(this.$el.height());
  },
  disableSticky: function() {

    // Remove sticky functionality and recalculate offset for header sticky
    this.$el.parent().unstick();

    this.resetHeader(0);
  },
  hide: function() {

    // Remove announcement bar and set cookie to hide it for 30 days
    $('body').removeClass('announcement-bar--visible');
    this.disableSticky();
    Cookies.set('announcement-bar', 'dismiss', { expires: 30 });
  },
  resetHeader: function(offset) {
    if (!window.PXUTheme.jsHeader) return;

    if (window.PXUTheme.jsHeader.enable_sticky === true && isScreenSizeLarge()) {
      if (window.PXUTheme.theme_settings.header_layout != 'vertical') {
        // Reset desktop sticky header
        window.PXUTheme.jsHeader.disableSticky();
        window.PXUTheme.jsHeader.enableSticky(offset);
      }
    } else if (window.PXUTheme.jsHeader.enable_sticky === true && !isScreenSizeLarge()) {
      // Reset mobile sticky header
      window.PXUTheme.mobileMenu.disableSticky();
      window.PXUTheme.mobileMenu.enableSticky(offset);
    }
  },
  getAnnouncementHeight() {
    const announcementHeight = $('.announcement-container').outerHeight() || 0;

    return announcementHeight;
  },
  unload: function($section) {

    // Clear event listeners in theme editor
    $('#announcement-bar').off();
    $('#announcement-bar').unstick();
  }
}

/******/ })()
;