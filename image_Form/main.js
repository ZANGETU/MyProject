var selectedImage;

function loadImage() {
  var input = document.getElementById('image-input');
  var container = document.getElementById('image-container');

  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function(e) {
      container.innerHTML = '<img src="' + e.target.result + '">';
      selectedImage = e.target.result;
    };

    reader.readAsDataURL(input.files[0]);
  }
}

function saveImage() {
  if (!selectedImage) {
    return;
  }

  var link = document.createElement('a');
  link.href = selectedImage;
  link.download = 'image.png';
  link.click();
}