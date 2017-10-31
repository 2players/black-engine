/* @echo EXPORT */
class TextRenderer extends Renderer {
  constructor() {
    super();

    this.text = null;
    this.style = null;
    this.multiline = false;
    this.autoSize = false;
    this.bounds = new Rectangle(0, 0, 100, 100);
    this.lineBounds = null; // array
    this.align = null; // TextInfo.FontAlign
    this.drawBounds = false;
    this.vAlign = null;

    this.__transformCache = new Matrix();
    this.__canvas = document.createElement('canvas');
    this.__context = this.__canvas.getContext('2d');
    this.__context.lineJoin = 'round';
    this.__context.miterLimit = 2;
    // this.canvas = document.createElement('canvas');
    // this.context = cvs.getContext('2d');
  }

  __renderLines(ctx, driver, lines, fontMetrics, isStroke = false) {
    let baseline = fontMetrics.baselineNormalized * this.style.size;
    let bottomline = fontMetrics.bottomNormalized * this.style.size;

    const strokeThickness = this.style.strokeThickness;

    if (isStroke === true) {
      ctx.lineWidth = strokeThickness;
      ctx.strokeStyle = driver.hexColorToString(this.style.strokeColor);
    } else {
      ctx.fillStyle = driver.hexColorToString(this.style.color);
    }

    let width = this.bounds.width;
    let height = this.bounds.width;

    // if (this.autoSize === false) {
    //   width = this.fieldWidth;
    //   height = this.fieldHeight;
    // }

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let lineBound = this.lineBounds[i];
      let lx = strokeThickness;
      let ly = (baseline + (baseline * i * this.lineHeight)) + strokeThickness;

      if (this.align === 'center')
        lx += (width - lineBound.width) * 0.5;
      else if (this.align === 'right')
        lx += width - lineBound.width;

      if (isStroke === true)
        ctx.strokeText(line, lx, ly);
      else
        ctx.fillText(line, lx, ly);
    }
  }

  render(driver) {
    if (this.text === null)
      return;

    const strokeThickness = this.style.strokeThickness;
    const cvs = this.__canvas;
    const ctx = this.__context;

    let canvasBounds = this.bounds.clone().inflate(strokeThickness, strokeThickness);

    if (this.dirty & DirtyFlag.RENDER_CACHE) {
      cvs.width = canvasBounds.width;
      cvs.height = canvasBounds.height;

      let fontMetrics = FontMetrics.get(this.style.name);

      if (this.drawBounds === true) {
        ctx.strokeStyle = driver.hexColorToString(0xff0000);
        ctx.strokeRect(0, 0, cvs.width, cvs.height);

        ctx.strokeStyle = driver.hexColorToString(0xff00ff);
        ctx.strokeRect(0, 0, this.bounds.width, this.bounds.height);
      }

      ctx.font = `${this.style.size}px ${this.style.name}`;
      ctx.textBaseline = 'alphabetic'; // alphabetic      

      const lines = this.multiline === true ? this.text.split('\n') : [this.text.replace(/\n/g, '')];

      if (this.drawBounds === true) {
        for (let i = 0; i < lines.length; i++) {
          let line = this.lineBounds[i];
          ctx.strokeRect(line.x, line.y, line.width, line.height);
        }
      }

      if (strokeThickness > 0) {
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        this.__renderLines(ctx, driver, lines, fontMetrics, true)
      }

      this.__renderLines(ctx, driver, lines, fontMetrics, false)

      if (this.texture === null)
        this.texture = new Texture(cvs);
      else
        this.texture.update(cvs);
    }

    let fieldXOffset = 0;
    let fieldYOffset = 0;

    if (this.autoSize === false) {
      if (this.align === 'center')
        fieldXOffset = (this.fieldWidth - this.bounds.width) * 0.5;
      else if (this.align === 'right')
        fieldXOffset = this.fieldWidth - this.bounds.width;

      if (this.vAlign === 'middle')
        fieldYOffset = (this.fieldHeight - this.bounds.height) * 0.5;
      else if (this.vAlign === 'bottom')
        fieldYOffset = this.fieldHeight - this.bounds.height;
    }

    if (strokeThickness !== 0 || this.autoSize === false) {
      this.transform.copyTo(this.__transformCache);
      this.__transformCache.translate(-strokeThickness + fieldXOffset, -strokeThickness + fieldYOffset);
      driver.setTransform(this.__transformCache);
    } else {
      driver.setTransform(this.transform);
    }

    driver.globalAlpha = this.alpha;
    driver.globalBlendMode = this.blendMode;
  }
}

/* @echo EXPORT */
class TextRendererCanvas extends TextRenderer {
  render(driver) {
    super.render(driver);

    driver.drawTexture(this.texture);
  }
}