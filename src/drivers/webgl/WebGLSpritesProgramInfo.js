const vertexShaderSource = `
  attribute vec2 aVertexPos;
  attribute vec4 aModelMatrix;
  attribute vec2 aModelPos;
  attribute float aAlpha;
  attribute vec2 aTexCoord;
  attribute float aTexSlot;
  attribute vec3 aTint;
  
  varying vec2 vTexCoord;
  varying float vTexSlot;
  varying vec4 vColor;

  uniform vec2 uProjection;

  void main() {
    vec2 pos = mat2(aModelMatrix) * aVertexPos + aModelPos;
    gl_Position = vec4(pos.x * uProjection.x - 1.0, -pos.y * uProjection.y + 1.0, 0.0, 1.0);
    
    vTexCoord = aTexCoord;
    vTexSlot = aTexSlot + 0.5;
    vColor = vec4(aTint * aAlpha, aAlpha);
  }
`;

const fragmentShaderSource = `
  precision lowp float;
  
  varying vec2 vTexCoord;
  varying float vTexSlot;
  varying vec4 vColor;
  
  uniform sampler2D uSamplers[MAX_TEXTURE_IMAGE_UNITS];
  
  void main() {
    int texSlot = int(vTexSlot);
    
    for (int i = 0; i < MAX_TEXTURE_IMAGE_UNITS; i++) {
      if (i == texSlot) {
        gl_FragColor = texture2D(uSamplers[i], vTexCoord) * vColor;
        return;
      }
    }
  }
`;

const QUAD = [`left`, `top`, `right`, `top`, `right`, `bottom`, `left`, `bottom`];

/* @echo EXPORT */
class WebGLSpritesProgramInfo extends WebGLBaseProgramInfo {
  constructor(renderer) {
    const gl = renderer.gl;
    const UNITS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

    super(renderer, vertexShaderSource, fragmentShaderSource.replace(/MAX_TEXTURE_IMAGE_UNITS/g, UNITS));

    this.setAttributesInfo({
      // aVertexPos  : {Type: Float32Array, normalize: false},
      // aModelMatrix: {Type: Float32Array, normalize: false},
      // aModelPos   : {Type: Float32Array, normalize: false},
      // aAlpha      : {Type: Float32Array, normalize: false},
      // aTexCoord   : {Type: Float32Array, normalize: false},
      // aTexSlot    : {Type: Float32Array, normalize: false},
      aTint       : {Type: Uint8Array, normalize: true, type: gl.UNSIGNED_BYTE},
    });

    this.MAX_TEXTURE_IMAGE_UNITS = UNITS;
  }

  init(clientWidth, clientHeight) {
    this.uniforms.uProjection = new Float32Array([clientWidth, clientHeight]);
    this.uniforms.uSamplers = new Int32Array(new Array(this.MAX_TEXTURE_IMAGE_UNITS).fill(0).map((v, i) => i));
  }

  onResize(msg, rect) {
    this.uniforms.uProjection = new Float32Array(rect.width, rect.height);
  }

  save(gameObject) {

  }

  setTransform(m) {
    this.mTransform = m;
  }

  set globalAlpha(value) {
    this.mGlobalAlpha = value;
  }

  set tint(value) {
    this.mTint = value;
  }

  drawImage(texture, bounds) {
    const modelMatrix = this.mTransform.value;
    const attributes = this.attributes;
    const region = texture.relativeRegion;
    const alpha = this.mGlobalAlpha;
    const tint = this.mTint;
    let texSlot = this.mRenderer.state.bindTexture(texture);

    const r = (tint >> 16) & 255;
    const g = (tint >> 8) & 255;
    const b = tint & 255;

    if (texSlot === -1) {
      this.flush();
      texSlot = this.mRenderer.state.bindTexture(texture);
    }

    for (let i = 0; i < 8; i += 2) {
      attributes.aModelMatrix[0] = modelMatrix[0];
      attributes.aModelMatrix[1] = modelMatrix[1];
      attributes.aModelMatrix[2] = modelMatrix[2];
      attributes.aModelMatrix[3] = modelMatrix[3];
      attributes.aModelPos[0] = modelMatrix[4];
      attributes.aModelPos[1] = modelMatrix[5];

      attributes.aVertexPos[0] = bounds[QUAD[i]];
      attributes.aVertexPos[1] = bounds[QUAD[i + 1]];

      attributes.aTexCoord[0] = region[QUAD[i]];
      attributes.aTexCoord[1] = region[QUAD[i + 1]];

      attributes.aAlpha = alpha;
      attributes.aTexSlot = texSlot;
      attributes.aTint[0] = r;
      attributes.aTint[1] = g;
      attributes.aTint[2] = b;

      attributes.nextVertex(); 
    }
  }

  flush() {
    super.flush();

    const gl = this.gl;

    this.mRenderer.state.bindArrayBuffer(this.mGLArrayBuffer);
    this.mRenderer.state.bindElementBuffer(this.mGLElementArrayBuffer);
const a = new Float32Array(this.attributes.data)
    gl.bufferData(gl.ARRAY_BUFFER, this.attributes.data, gl.STREAM_DRAW);
    gl.drawElements(gl.TRIANGLE_STRIP, this.attributes.countForElementsDraw, gl.UNSIGNED_SHORT, 0);
    
    this.attributes.clear();
  }
}