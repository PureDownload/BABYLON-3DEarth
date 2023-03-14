//添加星空背景
export const starBackground = (scene) => {
  // Emitter object
  var stars = BABYLON.Mesh.CreateBox("emitter", 2, scene);
  var starsParticles = new BABYLON.ParticleSystem("starsParticles", 500, scene);
  // 添加材质
  starsParticles.particleTexture = new BABYLON.Texture(
    "texture/star.png",
    scene
  );

  // Where the stars particles come from
  var starsEmitter = new BABYLON.SphereParticleEmitter();

  // 发射的范围
  starsEmitter.radius = 200;
  starsEmitter.radiusRange = 0; // emit only from shape surface

  starsParticles.emitter = stars; // the starting object, the emitter
  starsParticles.particleEmitterType = starsEmitter;

  // Random starting color
  starsParticles.color1 = new BABYLON.Color4(0.898, 0.737, 0.718, 1.0);
  starsParticles.color2 = new BABYLON.Color4(0.584, 0.831, 0.894, 1.0);

  starsParticles.minSize = 0.015;
  starsParticles.maxSize = 1;

  starsParticles.minLifeTime = 999999;
  starsParticles.maxLifeTime = 999999;

  // Burst rate
  // 发射的粒子数量
  starsParticles.manualEmitCount = 300;
  starsParticles.maxEmitPower = 0.0;

  // 设置粒子模糊
  starsParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

  starsParticles.gravity = new BABYLON.Vector3(0, 0, 0);

  starsParticles.minAngularSpeed = 0.0;
  starsParticles.maxAngularSpeed = 0.0;

  starsParticles.minEmitPower = 0.0;
  starsParticles.maxAngularSpeed = 0.0;

  starsParticles.isBillboardBased = true;

  starsParticles.renderingGroupId = 0;

  starsParticles.start();
};
