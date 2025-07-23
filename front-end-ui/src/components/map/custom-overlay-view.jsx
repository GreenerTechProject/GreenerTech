class CustomOverlayView extends window.google.maps.OverlayView {
    onAdd() {
  this.div = document.createElement("div");
  this.div.style.borderStyle = "none";
  this.div.style.borderWidth = "0px";
  this.div.style.position = "absolute";

  // Create the img element and attach it to the div.
  const img = document.createElement("img");

  img.src = this.image;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.position = "absolute";
  this.div.appendChild(img);

  // Add the element to the "overlayLayer" pane.
  const panes = this.getPanes();

  panes.overlayLayer.appendChild(this.div);
    }   
}