const checkbox = document.getElementById('power');

checkbox.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    alert('checked');
  } else {
    alert('not checked');
  }
});