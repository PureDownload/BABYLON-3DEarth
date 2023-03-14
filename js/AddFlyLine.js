import { lon2xyz } from "./countryPolygon.js";

export const addFlyLine = (
  formPoint,
  toPoint,
  flyLineMesh
) => {
  var earthRadius = 100;
  var coefficient = 1;
  var fromXyz = lon2xyz(earthRadius, formPoint.longitude, formPoint.latitude);
  var toXyz = lon2xyz(earthRadius, toPoint.longitude, toPoint.latitude);
  var allPoints = getCurvePoints(fromXyz, toXyz, earthRadius, coefficient);

  var cubicBezierCurve = flyLineMesh.addFly({
    curve: allPoints, //飞线飞线其实是N个点构成的
    color: "rgba(255, 147, 0, 1)", //点的颜色
    width: 0.3, //点的半径
    length: Math.ceil((allPoints.length * 3) / 5), //飞线的长度（点的个数）
    speed: 1 + 10, //飞线的速度
    repeat: Infinity, //循环次数
  });
  return { lineMesh: cubicBezierCurve, allPoints };
};

/**
 * 根据空间坐标起点终点获取曲线需要的points
 * @param fromXyz 起点空间坐标系 {x,y,z}
 * @param toXyz 终点空间坐标系
 * @param radius 半径
 * @param coefficient
 * @returns
 */
const getCurvePoints = (fromXyz, toXyz, radius, coefficient = 1) => {
  var curvePoints = new Array(); // 线条数组
  curvePoints.push(new BABYLON.Vector3(fromXyz.x, fromXyz.y, fromXyz.z));

  //根据城市之间距离远近，取不同个数个点
  var distanceDivRadius =
    Math.sqrt(
      (fromXyz.x - toXyz.x) * (fromXyz.x - toXyz.x) +
        (fromXyz.y - toXyz.y) * (fromXyz.y - toXyz.y) +
        (fromXyz.z - toXyz.z) * (fromXyz.z - toXyz.z)
    ) / radius;
  // 普通曲线
  var partCount = 3 + Math.ceil(distanceDivRadius * 4); // 点的个数
  // 贝塞尔曲线
  // var partCount = 2; // 点的个数
  for (var i = 0; i < partCount; i++) {
    // 普通曲线
    var partCoefficient =
      coefficient + (partCount - Math.abs((partCount - 1) / 2 - i)) * 0.01;

    var partTopXyz = getPartTopPoint(
      {
        x:
          (fromXyz.x * (partCount - i)) / partCount +
          (toXyz.x * (i + 1)) / partCount,
        y:
          (fromXyz.y * (partCount - i)) / partCount +
          (toXyz.y * (i + 1)) / partCount,
        z:
          (fromXyz.z * (partCount - i)) / partCount +
          (toXyz.z * (i + 1)) / partCount,
      },
      radius,
      partCoefficient
    );
    curvePoints.push(new BABYLON.Vector3(partTopXyz.x, partTopXyz.y, partTopXyz.z));
  }
  curvePoints.push(new BABYLON.Vector3(toXyz.x, toXyz.y, toXyz.z));
  //从B样条里获取点 可用该数量控制线条运行速度
  var pointCount = Math.ceil(30 * partCount);

  //使用B样条，将这些点拟合成一条曲线（这里没有使用贝赛尔曲线，因为拟合出来的点要在地球周围，不能穿过地球）
  var curve = BABYLON.Curve3.CreateCatmullRomSpline(curvePoints, pointCount);

  var allPoints = curve.getPoints();
  return allPoints;
};

/**
 * 根据空间坐标起点终点获取曲线需要的points
 * @param fromXyz 起点空间坐标系 {x,y,z}
 * @param toXyz 终点空间坐标系
 * @param radius 半径
 * @param coefficient
 * @returns
 */
const getPartTopPoint = (innerPoint, earthRadius, partCoefficient) => {
  var fromPartLen = Math.sqrt(
    innerPoint.x * innerPoint.x +
      innerPoint.y * innerPoint.y +
      innerPoint.z * innerPoint.z
  );
  return {
    x: (innerPoint.x * partCoefficient * earthRadius) / fromPartLen,
    y: (innerPoint.y * partCoefficient * earthRadius) / fromPartLen,
    z: (innerPoint.z * partCoefficient * earthRadius) / fromPartLen,
  };
};
