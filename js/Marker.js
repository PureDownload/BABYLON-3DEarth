import { lon2xyz } from './countryPolygon.js'
// 地球mark点生成
export const createPoint = (scene, mapPoint, earthRadius) => {
  // 引入point图片和动画图片
  const pointTexture = new BABYLON.Texture("/texture/point.png", scene);
  const waveTexture = new BABYLON.Texture("/texture/wave.png", scene);
  const pointMaterial = new BABYLON.StandardMaterial(
    "pointMaterial",
    scene
  );
  const waveMaterial = new BABYLON.StandardMaterial(
    "waveMaterial",
    scene
  );
  // 设置材质显示图片
  pointMaterial.diffuseTexture = pointTexture;
  waveMaterial.diffuseTexture = waveTexture;
  // pointMaterial.transparencyMode = 4
  // waveMaterial.transparencyMode = 4
  // 设置透明
  pointMaterial.diffuseTexture.hasAlpha = true;
  waveMaterial.diffuseTexture.hasAlpha = true;
  waveMaterial.useAlphaFromDiffuseTexture = true;

  // 计算物体大小
  var size = earthRadius * 0.04; // 标点大小
  var waveSize = earthRadius * 0.1; // 动态光圈大小
  const pointPlane = new BABYLON.MeshBuilder.CreatePlane(
    "pointPlane",
    { diameter: size },
    scene
  );
  const wavePlane = new BABYLON.MeshBuilder.CreatePlane(
    "wavePlane",
    { diameter: waveSize },
    scene
  );
  // 设置物体材质
  pointPlane.material = pointMaterial;
  wavePlane.material = waveMaterial;

  pointPlane.scaling = new BABYLON.Vector3(size, size, size);
  wavePlane.scaling = new BABYLON.Vector3(waveSize, waveSize, waveSize);

  // 设置私有属性 为了光圈动画
  (wavePlane).size = waveSize; //自顶一个属性，表示mesh静态大小
  (wavePlane)._s = Math.random() * 1.0 + 1.0; //自定义属性._s表示mesh在原始大小基础上放大倍数  光圈在原来mesh.size基础上1~2倍之间变化

  // 根据坐标计算球面坐标点
  const cityXyz = lon2xyz(
    earthRadius,
    mapPoint.longitude,
    mapPoint.latitude
  );
  pointPlane.position = new BABYLON.Vector3(cityXyz.x, cityXyz.y, cityXyz.z);
  wavePlane.position = new BABYLON.Vector3(cityXyz.x, cityXyz.y, cityXyz.z);

  // mesh姿态设置
  // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
  var coordVec3 = new BABYLON.Vector3(cityXyz.x, cityXyz.y, cityXyz.z).normalize();
  // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
  var meshNormal = new BABYLON.Vector3(0, 0, -1);
  // 四元数属性.quaternion表示mesh的角度状态
  //.setFromUnitVectors();计算两个向量之间构成的四元数值
  const resultQuaternion = new BABYLON.Quaternion();
  BABYLON.Quaternion.FromUnitVectorsToRef(meshNormal, coordVec3, resultQuaternion);
  pointPlane.rotationQuaternion = resultQuaternion;
  wavePlane.rotationQuaternion = resultQuaternion;

  return { pointPlane, wavePlane };
};
