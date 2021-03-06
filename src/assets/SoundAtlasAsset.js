/**
 * Sound file asset class responsible for loading audio atlas files.
 *
 * @cat assets
 * @extends Asset
 */
/* @echo EXPORT */
class SoundAtlasAsset extends Asset {
  /**
   * Creates new SoundAtlasAsset instance.
   *
   * @param {string} name Sound name.
   * @param {string} soundUrl  URL to load audio atlas from.
   * @param {string} dataUrl  URL to load atlas data from.
   */
  constructor(name, soundUrl, dataUrl) {
    super(name);

    if (Device.webAudioSupported === false)
      return;

    if (Black.instance.hasSystem(MasterAudio) === false) {
      Debug.warn('[SoundAsset] Loading sound files without MasterAudio system.');
      return;
    }

    /** @private @type {XHRAssetLoader} */
    this.mAudioXHR = new XHRAssetLoader(soundUrl);
    this.mAudioXHR.responseType = 'arraybuffer';
    this.addLoader(this.mAudioXHR);

    /** @private @type {XHRAssetLoader} */
    this.mDataXHR = new XHRAssetLoader(dataUrl);
    this.mDataXHR.mimeType = 'application/json';
    this.mDataXHR.responseType = 'json';
    this.addLoader(this.mDataXHR);
  }

  /**
   * @inheritDoc
   */
  onAllLoaded() {
    let undecodedAudio = /** @type {!ArrayBuffer} */ (this.mAudioXHR.data);
    MasterAudio.context.decodeAudioData(undecodedAudio, (buffer) => {
      super.ready(new SoundAtlasClip(buffer, this.mDataXHR.data));
    });
  }
}