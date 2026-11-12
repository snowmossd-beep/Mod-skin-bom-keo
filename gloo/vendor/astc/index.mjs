var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/astc/enums.ts
var ASTCProfile = /* @__PURE__ */ ((ASTCProfile3) => {
  ASTCProfile3[ASTCProfile3["LDR_SRGB"] = 0] = "LDR_SRGB";
  ASTCProfile3[ASTCProfile3["LDR"] = 1] = "LDR";
  ASTCProfile3[ASTCProfile3["HDR_RGB_LDR_A"] = 2] = "HDR_RGB_LDR_A";
  ASTCProfile3[ASTCProfile3["HDR"] = 3] = "HDR";
  return ASTCProfile3;
})(ASTCProfile || {});
var ASTCQualityPreset = /* @__PURE__ */ ((ASTCQualityPreset2) => {
  ASTCQualityPreset2[ASTCQualityPreset2["FASTEST"] = 0] = "FASTEST";
  ASTCQualityPreset2[ASTCQualityPreset2["FAST"] = 10] = "FAST";
  ASTCQualityPreset2[ASTCQualityPreset2["MEDIUM"] = 60] = "MEDIUM";
  ASTCQualityPreset2[ASTCQualityPreset2["THOROUGH"] = 98] = "THOROUGH";
  ASTCQualityPreset2[ASTCQualityPreset2["VERYTHOROUGH"] = 99] = "VERYTHOROUGH";
  ASTCQualityPreset2[ASTCQualityPreset2["EXHAUSTIVE"] = 100] = "EXHAUSTIVE";
  return ASTCQualityPreset2;
})(ASTCQualityPreset || {});
var ASTCConfigFlags = /* @__PURE__ */ ((ASTCConfigFlags2) => {
  ASTCConfigFlags2[ASTCConfigFlags2["MAP_NORMAL"] = 1] = "MAP_NORMAL";
  ASTCConfigFlags2[ASTCConfigFlags2["USE_DECODE_UNORM8"] = 2] = "USE_DECODE_UNORM8";
  ASTCConfigFlags2[ASTCConfigFlags2["USE_APLHA_WEIGHT"] = 4] = "USE_APLHA_WEIGHT";
  ASTCConfigFlags2[ASTCConfigFlags2["USE_PERCEPTUAL"] = 8] = "USE_PERCEPTUAL";
  ASTCConfigFlags2[ASTCConfigFlags2["DECOMPRESS_ONLY"] = 16] = "DECOMPRESS_ONLY";
  ASTCConfigFlags2[ASTCConfigFlags2["SELF_DECOMPRESS_ONLY"] = 32] = "SELF_DECOMPRESS_ONLY";
  ASTCConfigFlags2[ASTCConfigFlags2["MAP_RGBM"] = 64] = "MAP_RGBM";
  return ASTCConfigFlags2;
})(ASTCConfigFlags || {});
var ASTCType = /* @__PURE__ */ ((ASTCType2) => {
  ASTCType2[ASTCType2["U8"] = 0] = "U8";
  ASTCType2[ASTCType2["F16"] = 1] = "F16";
  ASTCType2[ASTCType2["F32"] = 2] = "F32";
  return ASTCType2;
})(ASTCType || {});
var ASTCSwizzleComponentSelector = /* @__PURE__ */ ((ASTCSwizzleComponentSelector2) => {
  ASTCSwizzleComponentSelector2[ASTCSwizzleComponentSelector2["R"] = 0] = "R";
  ASTCSwizzleComponentSelector2[ASTCSwizzleComponentSelector2["G"] = 1] = "G";
  ASTCSwizzleComponentSelector2[ASTCSwizzleComponentSelector2["B"] = 2] = "B";
  ASTCSwizzleComponentSelector2[ASTCSwizzleComponentSelector2["A"] = 3] = "A";
  ASTCSwizzleComponentSelector2[ASTCSwizzleComponentSelector2["ZERO"] = 4] = "ZERO";
  ASTCSwizzleComponentSelector2[ASTCSwizzleComponentSelector2["ONE"] = 5] = "ONE";
  ASTCSwizzleComponentSelector2[ASTCSwizzleComponentSelector2["Z"] = 6] = "Z";
  return ASTCSwizzleComponentSelector2;
})(ASTCSwizzleComponentSelector || {});

// src/astc/ASTCConfig.ts
var ASTCConfig = class _ASTCConfig {
  profile;
  flags;
  blockX;
  blockY;
  blockZ;
  quality;
  cwRWeight;
  cwGWeight;
  cwBWeight;
  cwAWeight;
  aScaleRadius;
  rgbmMScale;
  tunePartitionCountLimit;
  tune2partitionIndexLimit;
  tune3partitionIndexLimit;
  tune4partitionIndexLimit;
  tuneBlockModeLimit;
  tuneRefinementLimit;
  tuneCandidateLimit;
  tune2partitioningCandidateLimit;
  tune3partitioningCandidateLimit;
  tune4partitioningCandidateLimit;
  tuneDbLimit;
  tuneMseOvershoot;
  tune2partitionEarlyOutLimitFactor;
  tune3partitionEarlyOutLimitFactor;
  tune2planeEarlyOutLimitCorrelation;
  tuneSearchMode0Enable;
  /**
   * Creates a new ASTC codec configuration.
   *
   * @param profile Target color profile.
   * @param blockX ASTC block width.
   * @param blockY ASTC block height.
   * @param blockZ ASTC block depth. Use `1` for 2D textures. Default is 1.
   * @param quality Compression effort preset or numeric effort value. Default is medium.
   * @param flags Bitwise combination of {@link ASTCConfigFlags}.
   * @throws {TypeError} If the block size is not a valid ASTC block size.
   */
  constructor(profile, blockX, blockY, blockZ = 1, quality = 60 /* MEDIUM */, flags = 0) {
    _ASTCConfig.validateBlockSize(blockX, blockY, blockZ);
    this.profile = profile;
    this.blockX = blockX;
    this.blockY = blockY;
    this.blockZ = blockZ;
    this.quality = quality;
    this.flags = flags;
  }
  /**
   * Returns `true` if this configuration is marked as decompress-only.
   */
  get isDecompressOnly() {
    return (this.flags & 16 /* DECOMPRESS_ONLY */) !== 0;
  }
  /**
   * Converts this config into the plain object shape consumed by the wasm bindings.
   *
   * @returns Internal wasm-facing config object.
   */
  toRaw() {
    return {
      profile: this.profile,
      flags: this.flags,
      blockX: this.blockX,
      blockY: this.blockY,
      blockZ: this.blockZ,
      quality: this.quality,
      cwRWeight: this.cwRWeight,
      cwGWeight: this.cwGWeight,
      cwBWeight: this.cwBWeight,
      cwAWeight: this.cwAWeight,
      aScaleRadius: this.aScaleRadius,
      rgbmMScale: this.rgbmMScale,
      tunePartitionCountLimit: this.tunePartitionCountLimit,
      tune2partitionIndexLimit: this.tune2partitionIndexLimit,
      tune3partitionIndexLimit: this.tune3partitionIndexLimit,
      tune4partitionIndexLimit: this.tune4partitionIndexLimit,
      tuneBlockModeLimit: this.tuneBlockModeLimit,
      tuneRefinementLimit: this.tuneRefinementLimit,
      tuneCandidateLimit: this.tuneCandidateLimit,
      tune2partitioningCandidateLimit: this.tune2partitioningCandidateLimit,
      tune3partitioningCandidateLimit: this.tune3partitioningCandidateLimit,
      tune4partitioningCandidateLimit: this.tune4partitioningCandidateLimit,
      tuneDbLimit: this.tuneDbLimit,
      tuneMseOvershoot: this.tuneMseOvershoot,
      tune2partitionEarlyOutLimitFactor: this.tune2partitionEarlyOutLimitFactor,
      tune3partitionEarlyOutLimitFactor: this.tune3partitionEarlyOutLimitFactor,
      tune2planeEarlyOutLimitCorrelation: this.tune2planeEarlyOutLimitCorrelation,
      tuneSearchMode0Enable: this.tuneSearchMode0Enable
    };
  }
  /**
   * Validates that a requested ASTC block size is legal for 2D or 3D ASTC.
   *
   * @param blockX Block width.
   * @param blockY Block height.
   * @param blockZ Block depth.
   * @throws {TypeError} If the block size is invalid.
   */
  static validateBlockSize(blockX, blockY, blockZ) {
    const is2D = blockZ === 1;
    const key = is2D ? `${blockX}x${blockY}` : `${blockX}x${blockY}x${blockZ}`;
    if (is2D) {
      if (!this.VALID_2D_BLOCK_SIZES.has(key)) {
        throw new TypeError(`Invalid ASTC 2D block size: ${key}`);
      }
      return;
    }
    if (!this.VALID_3D_BLOCK_SIZES.has(key)) {
      throw new TypeError(`Invalid ASTC 3D block size: ${key}`);
    }
  }
  /**
   * A set of valid 2D block sizes.
   */
  static VALID_2D_BLOCK_SIZES = /* @__PURE__ */ new Set([
    "4x4",
    "5x4",
    "5x5",
    "6x5",
    "6x6",
    "8x5",
    "8x6",
    "8x8",
    "10x5",
    "10x6",
    "10x8",
    "10x10",
    "12x10",
    "12x12"
  ]);
  /**
   * A set of valid 3D block sizes.
   */
  static VALID_3D_BLOCK_SIZES = /* @__PURE__ */ new Set([
    "3x3x3",
    "4x3x3",
    "4x4x3",
    "4x4x4",
    "5x4x4",
    "5x5x4",
    "5x5x5",
    "6x5x5",
    "6x6x5",
    "6x6x6"
  ]);
};

// src/astc/rawModule.ts
var modulePromise;
async function getRawModule() {
  if (!modulePromise) {
    modulePromise = loadRawModule().catch((error) => {
      modulePromise = void 0;
      throw error;
    });
  }
  return modulePromise;
}
async function loadRawModule() {
  const moduleUrl = new URL("./wasm/astcenc.js", import.meta.url);
  const createModule = await import(moduleUrl.href);
  return createModule.default();
}

// src/astc/ASTCError.ts
var ASTCError = class extends Error {
  /**
   * Creates a new ASTC error;
   * 
   * @param message The error message.
   */
  constructor(message) {
    super(message);
    this.name = "ASTCError";
  }
};

// src/astc/ASTCContext.ts
var ASTCContext = class _ASTCContext {
  config;
  threads;
  /**
   * Creates an ASTC execution context.
   *
   * @param config Codec configuration.
   * @param threads Worker count. Pass `0` to use automatic thread selection. Default is 1.
   * @throws {ASTCError} If `threads` is negative or not an integer.
   */
  constructor(config, threads = 1) {
    if (!Number.isInteger(threads) || threads < 0) {
      throw new ASTCError("threads must be a non-negative integer.");
    }
    this.config = config;
    this.threads = _ASTCContext.resolveThreads(threads);
  }
  /**
   * Compresses an uncompressed image into ASTC block data.
   *
   * @param image Source image.
   * @param swizzle Compression swizzle.
   * @returns Compressed ASTC payload.
   * @throws {ASTCError} If the image does not contain input data.
   */
  async compress(image, swizzle) {
    if (!image.data) {
      throw new ASTCError("compress() requires image.data to be set.");
    }
    const module = await getRawModule();
    return module.compressImage(image.toRaw(), this.config.toRaw(), swizzle.toRaw(), this.threads);
  }
  /**
   * Decompresses ASTC block data into an output image.
   *
   * The decoded bytes are written into `image.data`, and the same image instance is returned.
   *
   * @param data Compressed ASTC payload without the 16 byte header.
   * @param image Output image descriptor.
   * @param swizzle Decompression swizzle.
   * @returns The same image instance, populated with decoded data.
   */
  async decompress(data, image, swizzle) {
    const module = await getRawModule();
    image.data = module.decompressImage(data, image.toRaw(false), this.config.toRaw(), swizzle.toRaw(), this.threads);
    return image;
  }
  /**
   * Resolves a user-provided thread count into the actual thread count used by the runtime.
   *
   * A value of `0` means automatic selection.
   *
   * @param threads Requested thread count.
   * @returns Resolved thread count.
   */
  static resolveThreads(threads) {
    if (threads === 0) {
      if (typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number") {
        return Math.max(1, navigator.hardwareConcurrency);
      }
      if (typeof process !== "undefined" && process.versions?.node) {
        try {
          const os = __require("os");
          if (typeof os.availableParallelism === "function") {
            return Math.max(1, os.availableParallelism());
          }
          return Math.max(1, os.cpus().length);
        } catch {
          return 1;
        }
      }
      return 1;
    }
    return threads;
  }
};

// src/astc/ASTCImage.ts
var ASTCImage = class {
  dimX;
  dimY;
  dimZ;
  dataType;
  data;
  /**
   * Creates an image container for ASTC encode/decode operations.
   *
   * @param dataType Per-component data type.
   * @param dimX Image width in texels.
   * @param dimY Image height in texels.
   * @param dimZ Image depth in texels. Use `1` for 2D images. Default is 1.
   * @param data Optional packed RGBA image data.
   * @throws {ASTCError} If `data` does not match the expected byte length.
   */
  constructor(dataType, dimX, dimY, dimZ = 1, data) {
    this.dataType = dataType;
    this.dimX = dimX;
    this.dimY = dimY;
    this.dimZ = dimZ;
    this.data = data;
    if (data && data.length !== this.expectedByteLength()) {
      throw new ASTCError("Image data size does not match the image dimensions with the given data type!");
    }
  }
  /**
   * Computes the required byte size for this image's packed RGBA data buffer.
   *
   * @returns Expected byte length for {@link ASTCImage.data}.
   * @throws {ASTCError} If the image data type is invalid.
   */
  expectedByteLength() {
    const bytesPerComponent = this.dataType === 0 /* U8 */ ? 1 : this.dataType === 1 /* F16 */ ? 2 : this.dataType === 2 /* F32 */ ? 4 : 0;
    if (bytesPerComponent === 0) {
      throw new ASTCError("Invalid data type.");
    }
    return this.dimX * this.dimY * this.dimZ * 4 * bytesPerComponent;
  }
  /**
   * Converts this image into the plain object shape consumed by the wasm bindings.
   *
   * @param includeData Whether to include the `data` field in the returned object.
   * @returns Internal wasm-facing image object.
   */
  toRaw(includeData = true) {
    return {
      dimX: this.dimX,
      dimY: this.dimY,
      dimZ: this.dimZ,
      dataType: this.dataType,
      data: includeData ? this.data : void 0
    };
  }
};

// src/astc/ASTCSwizzle.ts
var ASTCSwizzle = class _ASTCSwizzle {
  r;
  g;
  b;
  a;
  /**
   * Creates a swizzle mapping.
   *
   * Defaults to the standard `RGBA` mapping.
   *
   * @param r Output red selector.
   * @param g Output green selector.
   * @param b Output blue selector.
   * @param a Output alpha selector.
   */
  constructor(r = 0 /* R */, g = 1 /* G */, b = 2 /* B */, a = 3 /* A */) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  /**
   * Parses a 4-character swizzle string.
   *
   * Supported characters are:
   * - `R`, `G`, `B`, `A`
   * - `0` for constant zero
   * - `1` for constant one
   * - `Z` for reconstructed normal Z
   *
   * Parsing is case-insensitive.
   *
   * @param swizzle Four-character swizzle string.
   * @returns Parsed swizzle.
   * @throws {ASTCError} If the string is malformed or contains invalid characters.
   */
  static fromString(swizzle) {
    if (swizzle.length !== 4) {
      throw new ASTCError("Swizzle string must be 4 characters long.");
    }
    const mapChar = (value) => {
      switch (value.toUpperCase()) {
        case "R":
          return 0 /* R */;
        case "G":
          return 1 /* G */;
        case "B":
          return 2 /* B */;
        case "A":
          return 3 /* A */;
        case "Z":
          return 6 /* Z */;
        case "0":
          return 4 /* ZERO */;
        case "1":
          return 5 /* ONE */;
        default:
          throw new ASTCError(`Invalid swizzle character: ${value}`);
      }
    };
    return new _ASTCSwizzle(
      mapChar(swizzle[0]),
      mapChar(swizzle[1]),
      mapChar(swizzle[2]),
      mapChar(swizzle[3])
    );
  }
  /**
   * Converts this swizzle into the plain object shape consumed by the wasm bindings.
   *
   * @returns Internal wasm-facing swizzle object.
   */
  toRaw() {
    return {
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a
    };
  }
};

// src/astc/computeErrorMetrics.ts
async function computeErrorMetrics(computeHDRMetrics, computeNormalMetrics, inputComponents, img1, img2, fstopLo, fstopHi) {
  if (!img1.data || !img2.data) {
    throw new ASTCError("computeErrorMetrics requires both images to have data.");
  }
  const module = await getRawModule();
  return module.computeErrorMetrics(
    computeHDRMetrics,
    computeNormalMetrics,
    inputComponents,
    img1.toRaw(),
    img2.toRaw(),
    fstopLo,
    fstopHi
  );
}
export {
  ASTCConfig,
  ASTCConfigFlags,
  ASTCContext,
  ASTCError,
  ASTCImage,
  ASTCProfile,
  ASTCQualityPreset,
  ASTCSwizzle,
  ASTCSwizzleComponentSelector,
  ASTCType,
  computeErrorMetrics
};
