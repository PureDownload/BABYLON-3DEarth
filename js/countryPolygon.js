/*
 * @Author: ZY
 * @Date: 2021-12-31 15:47:59
 * @LastEditors: ZY
 * @LastEditTime: 2022-01-05 10:15:57
 * @FilePath: /3d-earth/lib/src/earth/countryPolygon.ts
 * @Description: 世界轮廓
 */
import pointArr from '../storage/world.js'

//引入国家边界数据
// R:球面半径
export function countryLine(R, scene) {
  //类型数组创建顶点数据
  var vertices = new Float32Array(pointArr);

  const allPoints = pointArrToVector3(vertices);

  var cubicBezierCurve = BABYLON.MeshBuilder.CreateLines(
    "cbezier",
    { points: allPoints, updatable: true },
    scene
  );
  cubicBezierCurve.scaling = new BABYLON.Vector3(R, R, R);
  cubicBezierCurve.color = BABYLON.Color3.FromHexString("#a4e434");
  return cubicBezierCurve;
}

/**
 * 辖区数据转babylon坐标
 * @param vertices
 * @returns
 */
function pointArrToVector3(vertices) {
  const vecs = [];
  for (let i = 0; i < vertices.length; i += 3) {
    if (i + 2 > vertices.length) {
      break;
    }
    // 辖区数据为右手坐标系 z轴需要转为左手坐标系
    vecs.push(new BABYLON.Vector3(vertices[i], vertices[i + 1], -vertices[i + 2]));
  }
  return vecs;
}

/**
 * 将经纬度坐标转成球面坐标
 * @param {*} radius 
 * @param {*} longitude 
 * @param {*} latitude 
 * @returns 
 */
export function lon2xyz(radius, longitude, latitude) {
  var lon = (longitude * Math.PI) / 180; //转弧度值
  var lat = (latitude * Math.PI) / 180; //转弧度值
  // 右手坐标系需要 -90度 babylon使用左手坐标系 故屏蔽
  // lon = -lon; // three.js坐标系z坐标轴对应经度-90度，而不是90度

  // 经纬度坐标转球面坐标计算公式
  var x = radius * Math.cos(lat) * Math.cos(lon);
  var y = radius * Math.sin(lat);
  var z = radius * Math.cos(lat) * Math.sin(lon);
  // 返回球面坐标
  return {
    x: x,
    y: y,
    z: z,
  };
}
