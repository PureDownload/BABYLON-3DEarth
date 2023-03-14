
//添加地球云层贴图的Mesh到场景中
export const createEarthCloudImageMesh = (scene, diameter = 200) => {
  const cloudMaterial = new BABYLON.StandardMaterial("EarthMaterial", scene);
  cloudMaterial.diffuseTexture = new BABYLON.Texture(
    "texture/earth_cloud.png",
    scene
  );
  // 开启透明计算
  cloudMaterial.diffuseTexture.hasAlpha = true;
  cloudMaterial.useAlphaFromDiffuseTexture = true;
  
  // +5是为了比地球大，显示在地球上面
  const cloud = new BABYLON.MeshBuilder.CreateSphere(
    "Cloud",
    {
      diameter: diameter + 5
    },
    scene
  );
  cloud.material = cloudMaterial;
  return cloud;
};
