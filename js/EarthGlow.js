
/*
 * @Author: ZY
 * @Date: 2021-12-31 16:40:30
 * @LastEditors: ZY
 * @LastEditTime: 2022-01-05 14:53:18
 * @FilePath: /3d-earth/lib/src/earth/glow.ts
 * @Description: 大气层光环效果
 */
export const earthGlow =  (radius,imgUrl,scale, scene) =>{
    const plane = BABYLON.Mesh.CreatePlane("plane", radius*2, scene);
    // plane.parent = mesh
    plane.position.y = 0;
    plane.position.x = plane.position.x - 10;
    // plane.position.x = plane.position.x + 0;

    // 展示效果好 不兼容地球缩放
    // plane.scaling = new Vector3(0.82,0.82,0.82)
    // 该缩放比例可以兼容地球缩放
    // plane.scaling = new Vector3(0.78,0.78,0.78)
    plane.scaling = new BABYLON.Vector3(scale,scale,scale)

    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    const advancedDynamicTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
      plane
    );

    // const image = new GUI.Image("light", baseUrl + "texture/dqgq.png");
    // const image = new GUI.Image("light", baseUrl + "texture/earth_glow_light.png");
    const image = new BABYLON.GUI.Image("light", imgUrl);
    // image.width = 1
    // image.height = 1
    image.stretch = BABYLON.GUI.Image.STRETCH_NONE;
    advancedDynamicTexture.addControl(image);
    return plane
};