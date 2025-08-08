$(document).ready(function(event){
  var $elem = $('#slide-banner');
  var scrolled = 0;
  $(".scroll-arrow").on("click" ,function(){
    console.log("work");
    $('html, body').animate({scrollTop: $elem.height()}, 250);
  });
});

if ($(window).width() <= 798){
  
  $(".footer__content").each(function(){  
    $(this).find(".footer-content").hide();
    $(".footer-content.active").show();
  });

  $(".footer__content").each(function(){
    $(this).find(".footer__heading").click(function() {
      $('.footer__heading').removeClass('active').next().slideUp(200); 
      $(this).toggleClass("active").next().stop(true, false).slideToggle(200);      
      return false;
    });
  });
}
//redirect to link function
function redirectTo(e, link){
  e.preventDefault();
  window.location.href = link;
}

//notifyme button hide onload
setTimeout(function(){
    var currentUrl = window.location.href;
    console.log(currentUrl);
    
    const queryString = window.location.search;
    console.log(queryString);
    const urlParams = new URLSearchParams(queryString);
    const variant = urlParams.get('variant')
    console.log(variant);
    if(variant == ''){
      console.log('add hide class');
      document.querySelector('.klaviyo-bis-trigger').classList.add('hide');
    }else{
      console.log('remove hide class');
      document.querySelector('.klaviyo-bis-trigger').classList.remove('hide');
    }
}, 1000);


// sticky add to cart button 
jQuery(function($){
  $(window).on('scroll', function(){      
    var contentTop = $('.product-block--description').offset().top;
    var hHeight = $('#header').height();
 
    if($(this).scrollTop() > contentTop-hHeight){
      $('body').addClass('show-sticky-atc');
    }else{
      $('body').removeClass('show-sticky-atc');
    }
 }).scroll(); 
})


// Toggle 'open-size' class on click of '.option-title'
document.querySelectorAll(".option-title").forEach(function(element) {
  element.addEventListener("click", function(event) {
      event.stopPropagation(); // Prevent event bubbling to the document
      const nextElement = this.nextElementSibling;
      if (nextElement) {
        nextElement.classList.toggle("open-size");
      }
      // console.log('if condition');
      // console.log(document.querySelector('.webyzeProductColorsLabel').nextElementSibling.classList.contains("open-colors"));
      if (document.querySelector('.webyzeProductColorsLabel').nextElementSibling.classList.contains("open-colors")) {
        document.querySelector('.webyzeProductColorsLabel').nextElementSibling.classList.remove("open-colors");
      }
  });
});

// Remove 'open-size' class when clicking on '.swatch__option'
document.querySelectorAll(".swatch__option").forEach(function(element) {
  element.addEventListener("click", function() {
      document.querySelectorAll(".swatch__options").forEach(function(option) {
          option.classList.remove("open-size");
      });
  });
});



setTimeout(function () {
  // Add click event to elements with the class 'webyzeProductColorsLabel'
  document.querySelectorAll(".webyzeProductColorsLabel").forEach(function(label) {
      label.addEventListener("click", function() {
          // console.log(this);
          // Toggle 'active-label' class on the label
          this.classList.toggle("active-label");

          // Toggle 'open-colors' class on the next sibling element
          const nextElement = this.nextElementSibling;
          if (nextElement) {
              nextElement.classList.toggle("open-colors");
          }
      });
  });

  // Get the HTML content of the element with class 'currentSwatch' inside '.webyzeProductColors'
  var currentSwatchHtml = document.querySelector(".webyzeProductColors .currentSwatch")?.innerHTML;
  // console.log(currentSwatchHtml);
  // Append the current swatch HTML content as a new span element inside each 'webyzeProductColorsLabel'
  document.querySelectorAll(".webyzeProductColorsLabel").forEach(function(label) {
      const newSpan = document.createElement("span");
      newSpan.className = "swatchProductColor stickySwatchProductColor swatchType_image currentSwatch";
      newSpan.innerHTML = currentSwatchHtml;
      label.appendChild(newSpan);

      // Toggle the 'active-label' and 'webyzeProductColors' classes on the label
      label.classList.toggle("active-label");
      label.classList.toggle("webyzeProductColors");
  });
}, 3000);

document.addEventListener("click", function (event) {
  // Check if the click target is outside any element with the class 'webyzeProductColors'
  if (!event.target.closest(".webyzeProductColors")) {
      document.querySelectorAll(".webyzeProductColors").forEach(function (opt) {
          if (opt.classList.contains("open-colors")) {
              // console.log(opt);
              opt.classList.remove("open-colors");
          }
      });
  }
  document.querySelectorAll(".swatch__options").forEach(function(option) {
    option.classList.remove("open-size");
});
});


