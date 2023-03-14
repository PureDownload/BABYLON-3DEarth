# Babylon 系列-3D 地球的效果编写

#### 简介

> 这是 Babylonjs 实战系列的 3D 地球系列，具体效果参考了 Threejs 一位大佬的效果。而大佬的版本为 Threejs 的，所以我也将其改装成 BABYLON 版本来供大家学习。参考链接和本项目的 git 地址都会放在结尾供参考。
> 该项目将会将所有的效果一个一个拆解成一个个方法，单独进行讲解。方便大家理解

#### 1. 初始化一个基础 webgl 场景

```html
<canvas id="container" style="height:100vh;width: 100vw;"></canvas>
<!-- 基础类库 -->
<script src="./lib/babylon.js"></script>
<script>
  // 创建一个场景
  let canvas;
  let engine;
  let scene;

  // 调用方法生成对应效果
  createDefaultScene(); // 创建场景

  // 创建一个基本场景
  function createDefaultScene() {
    canvas = document.getElementById("container");
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    // 通用相机
    var camera = new BABYLON.ArcRotateCamera(
      "camera",
      (3 * Math.PI) / 8,
      (3 * Math.PI) / 8,
      300,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    // const camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0, 0, 5), scene);
    camera.attachControl(canvas, false); // 让摄像头控制画布，实现摄像头移动效果
    /* 创建2个光源：HemisphericLight是半球形光源，PointLight是点光源 */
    var light1 = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(1, 1, 0),
      scene
    );
    var light2 = new BABYLON.PointLight(
      "light2",
      new BABYLON.Vector3(0, 1, -1),
      scene
    );
    scene.clearColor.set(0, 0, 0, 1); // 为了方便查看效果 修改场景背景颜色

    // 渲染引擎启动定时循环，在定时循环中更新场景的每一帧
    engine.runRenderLoop(function () {
      scene.render();
    });
  }
</script>
```

在这一步可以生成一个最基本的场景

#### 2. 生成一个地球并贴图显示

```javascript
// 创建地球
function addEarth() {
  // 创建一个球当做地球容器
  const earth = new BABYLON.MeshBuilder.CreateSphere(
    "Earth",
    {
      diameter: 200, // 地球大小
    },
    scene
  );
  // 设置地球的材质
  const earthMaterial = new BABYLON.StandardMaterial("EarthMaterial", scene);
  earthMaterial.diffuseTexture = new BABYLON.Texture(
    "texture/dqn3.jpeg",
    this.scene
  );
  earthMaterial.emissiveColor = BABYLON.Color3.Teal();
  earth.material = earthMaterial;
  earth.rotation.x = Math.PI;
  // y轴有偏移 1.57为偏移量
  earth.rotation.y = Math.PI;
}
```

#### 3. 生成地球辖区线

在实现之前先讲一下辖区图是怎么画的，我们都知道 babylon 有 line 对象可以简单的画线，而画线则需要点(points 列表)。那么我们就需要知道怎么将经纬点转成 3D 空间点来画线,那么步骤如下：

- 网上收集世界辖区经纬点列表
- 将经纬点列表转换成 3D 坐标点列表
- 将生成的 3D 坐标点列表通过 Line 对象生成辖区线

1. 经纬点列表可以去网上找，或者去看我 github 案例，有现成
2. 经纬点转 3D 坐标点的工具方法

```javascript
/**
 * 将经纬度坐标转成球面坐标
 * @param {*} radius
 * @param {*} longitude
 * @param {*} latitude
 * @returns
 */
function lon2xyz(radius, longitude, latitude) {
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
```

3. 将生成的坐标点转换成线

```JavaScript
//引入国家边界数据
// R:球面半径
function countryLine(R, scene) {
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
```

至此辖区线就画好了，打架理解这个写法也可以试着去修改下完成自己的效果

#### 4.生成星星背景

星星背景使用 BABYLON 自带的粒子系统完成，粒子系统如果要做效果多的话还是挺难的，但是像星空背景这种只用发射一次粒子即可实现的效果还是挺简单的，这里贴上代码

```JavaScript
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
```

#### 5.云层效果的实现

云层效果的实现是很简单的，创建一个比地球大一点的球，贴上云层的贴图，加上透明计算即可。那么我们上代码吧

```JavaScript

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

```

#### 6. 地球光环的实现

地球光环就是贴了两张 GUI 图，GUI 可以想象成 BABYLON 的一些画页面的一些东西，可以写字，画按钮等。光环就是贴了两张图在地球后面。不过效果有心情的时候再优化，现在主要是讲这个东西，需要单独引入 GUI 库

```JavaScript

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
```

#### 7. 标注点和飞线的实现

标注点和飞线是实现了最久的一个效果，大家可以仔细看看实现的方式：<br/>
首先是标注点的一个实现，标注点即通过经纬度坐标在地球表面画一个圆圈，一个动态的圆圈。那这个动态的难点在哪里呢？

- 经纬度转 3D 空间坐标，这个在上面已经有方法了
- 这个圆圈怎么贴合地球呢？假如我们生成的圆圈是一个平面，那它是直的。但是地球是个球，它是曲面，所以要怎么贴合地球呢？
- 因为要做动态效果，那怎么实现这个动态效果的呢

1. 首先我们先生成一个标注点
   标注点由两部分组成，point 为点，wave 为要显示的动态效果，那么，只要设置好两个点的大小，曲面四元数，经纬度转的 3D 坐标点。那么一个静态的点就完成了。注意，点和图片需要设置透明显示，会好看

```javascript
export const createPoint = (scene, mapPoint, earthRadius) => {
  // 引入point图片和动画图片
  const pointTexture = new BABYLON.Texture("/texture/point.png", scene);
  const waveTexture = new BABYLON.Texture("/texture/wave.png", scene);
  const pointMaterial = new BABYLON.StandardMaterial("pointMaterial", scene);
  const waveMaterial = new BABYLON.StandardMaterial("waveMaterial", scene);
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
  wavePlane.size = waveSize; //自顶一个属性，表示mesh静态大小
  wavePlane._s = Math.random() * 1.0 + 1.0; //自定义属性._s表示mesh在原始大小基础上放大倍数  光圈在原来mesh.size基础上1~2倍之间变化

  // 根据坐标计算球面坐标点
  const cityXyz = lon2xyz(earthRadius, mapPoint.longitude, mapPoint.latitude);
  pointPlane.position = new BABYLON.Vector3(cityXyz.x, cityXyz.y, cityXyz.z);
  wavePlane.position = new BABYLON.Vector3(cityXyz.x, cityXyz.y, cityXyz.z);

  // mesh姿态设置
  // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
  var coordVec3 = new BABYLON.Vector3(
    cityXyz.x,
    cityXyz.y,
    cityXyz.z
  ).normalize();
  // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
  var meshNormal = new BABYLON.Vector3(0, 0, -1);
  // 四元数属性.quaternion表示mesh的角度状态
  //.setFromUnitVectors();计算两个向量之间构成的四元数值
  const resultQuaternion = new BABYLON.Quaternion();
  BABYLON.Quaternion.FromUnitVectorsToRef(
    meshNormal,
    coordVec3,
    resultQuaternion
  );
  pointPlane.rotationQuaternion = resultQuaternion;
  wavePlane.rotationQuaternion = resultQuaternion;

  return { pointPlane, wavePlane };
};
这部分即为贴合地球的设置;
~~~js;
// mesh姿态设置
// mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
var coordVec3 = new BABYLON.Vector3(
  cityXyz.x,
  cityXyz.y,
  cityXyz.z
).normalize();
// mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
var meshNormal = new BABYLON.Vector3(0, 0, -1);
// 四元数属性.quaternion表示mesh的角度状态
//.setFromUnitVectors();计算两个向量之间构成的四元数值
const resultQuaternion = new BABYLON.Quaternion();
BABYLON.Quaternion.FromUnitVectorsToRef(
  meshNormal,
  coordVec3,
  resultQuaternion
);
pointPlane.rotationQuaternion = resultQuaternion;
wavePlane.rotationQuaternion = resultQuaternion;
```

2. 设置动态效果
   刚才说了，有两个图片，一个是点，一个是动态效果。动态效果的改变在 engine 的 render 函数中更新，效果逻辑为：每次更新修改动态效果图片的大小和透明状态即可。大家可以去看看动态效果的图片想象一下<br/>
   下面是更新的代码

```js
/**
   * 光圈动画 将需要进行动画的光圈传入
   */
  _waveAnimate() {
    // 所有波动光圈都有自己的透明度和大小状态
    // 一个波动光圈透明度变化过程是：0~1~0反复循环
    this.waveMeshs.forEach(function (mesh) {
      mesh._s += 0.007;
      mesh.scaling = new BABYLON.Vector3(
        mesh.size * mesh._s,
        mesh.size * mesh._s,
        mesh.size * mesh._s
      );
      if (mesh._s <= 1.5) {
        mesh.material.alpha = (mesh._s - 1) * 2; //2等于1/(1.5-1.0)，保证透明度在0~1之间变化
      } else if (mesh._s > 1.5 && mesh._s <= 2) {
        mesh.material.alpha = 1 - (mesh._s - 1.5) * 2; //2等于1/(2.0-1.5) mesh缩放2倍对应0 缩放1.5被对应1
      } else {
        mesh._s = 1.0;
      }
    });
  }
```

3. 设置飞线
   飞线的话我们使用着色器语言 GLSL 进行实现，需要几方面呢？

- 第一我们需要设置飞线的两个点，通过曲线算法算出两条线的所有点画出一条线
- 第二我们使用 GLSL 来进行动画效果的显示，那么开始吧

4. 通过两个点算出线

```js
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
    curvePoints.push(
      new BABYLON.Vector3(partTopXyz.x, partTopXyz.y, partTopXyz.z)
    );
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
```

5. 生成一条线并添加渲染动画

```js
// 使用着色器生成飞线
class FlyLineMesh {
  scene; //* 场景对象
  flyId; //id
  baicSpeed; //* 基础速度
  flyShader;
  texture; //* 图片
  attrs = {};
  flyArr = []; //* 浮现数组

  constructor(scene) {
    this.scene = scene;
    this.flyId = 0;
    this.baicSpeed = 1;
    this.texture = new BABYLON.Texture("texture/point.png", scene);

    // 编写着色器
    // 顶点着色器 通过传进来的u_index和position来函数进入的次数
    // gl_Position 计算像素位置
    // gl_PointSize 像素点大小 实现头大尾小的效果
    // 片段着色器
    // 计算像素颜色
    this.flyShader = {
      vertexshader: ` 
        uniform float size; 
        uniform float time; 
        uniform float u_len; 
        uniform mat4 worldViewProjection;
        attribute float u_index;
        attribute vec3 position;
        varying float u_opacitys;
  
        void main() {
            if( u_index < time + u_len && u_index > time){
                float u_scale = 1.0 - (time + u_len - u_index) /u_len;
                u_opacitys = u_scale;
                vec4 mvPosition = vec4(position, 1.0);
                gl_Position = worldViewProjection * mvPosition;
                gl_PointSize = size * u_scale;
            }
        }
              `,
      fragmentshader: ` 
        uniform sampler2D u_map;
        uniform vec3 color;
        uniform float u_opacity;
        uniform float isTexture;
        varying float u_opacitys;
  
        void main() {
          vec4 u_color = vec4(color,u_opacity * u_opacitys);
          if( isTexture != 0.0 ){
              gl_FragColor = u_color * texture2D(u_map, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
          }else{
              gl_FragColor = u_color;
          }
        }`,
    };
    BABYLON.Effect.ShadersStore["customVertexShader"] =
      this.flyShader.vertexshader;
    BABYLON.Effect.ShadersStore["customFragmentShader"] =
      this.flyShader.fragmentshader;
  }

  /**
   * [addFly description]
   *
   * @param   {String}  opt.color  [颜色_透明度]
   * @param   {Array}   opt.curve  [线的节点]
   * @param   {Number}  opt.width  [宽度]
   * @param   {Number}  opt.length [长度]
   * @param   {Number}  opt.speed  [速度]
   * @param   {Number}  opt.repeat [重复次数]
   * @return  {Mesh}               [return 图层]
   */
  addFly({
    color = "rgba(56, 168, 39,1)",
    curve = [],
    width = 3,
    length = 10,
    speed = 1,
    repeat = 1,
  }) {
    // 获取线段的颜色
    let colorArr = this.getColorArr(color);
    // 添加着色器材质 根据attributes传入的position和u_index决定着色器进入次数
    // uniforms 设置着色器的属性 通过材质对象的set方法赋值 设置该值后如果着色器代码使用内置函数 也需要在此处声明
    let material = new BABYLON.ShaderMaterial(
      "myMaterial",
      this.scene,
      {
        vertex: "custom",
        fragment: "custom",
      },
      {
        attributes: ["position", "u_index"],
        uniforms: [
          "worldViewProjection",
          "color",
          "size",
          "u_len",
          "u_opacity",
          "time",
          "isTexture",
          "u_map",
        ],
      }
    );
    // 设置为粒子 需要设置该属性 gl_PointSize才会生效
    material.pointsCloud = true;
    // 设置uniforms 也可以通过设置属性来使着色器重新触发渲染
    material.setColor3("color", colorArr[0]);
    material.setFloat("size", 6);
    material.setFloat("u_len", length);
    material.setFloat("u_opacity", colorArr[1]);
    material.setFloat("time", -length);
    material.setTexture("u_map", this.texture);
    material.setFloat("isTexture", 1);

    // 设置attributes
    const position = new Float32Array(curve.length * 3);
    const u_index = new Float32Array(curve.length);

    let positionIndex = 0;
    curve.forEach(function (elem, index) {
      position[positionIndex] = elem.x;
      positionIndex++;
      position[positionIndex] = elem.y;
      positionIndex++;
      position[positionIndex] = elem.z;
      positionIndex++;
      u_index[index] = index;
    });
    // 创建一个mesh对象 使用该对象可以生成点
    var lines = new BABYLON.Mesh("lineMesh", this.scene);
    var vertexData = new BABYLON.VertexData();
    vertexData.positions = position;
    vertexData.applyToMesh(lines);

    lines.material = material;
    lines.name = "fly";
    lines.setVerticesData("position", position, false, 3);
    lines.setVerticesData("u_index", u_index, false, 1);

    lines._flyId = ++this.flyId;
    lines._speed = speed;
    lines._repeat = repeat;
    lines._been = 0;
    lines._total = curve.length;
    const flyId = lines._flyId;
    this.attrs[flyId] = { time: -length, length };

    this.flyArr.push(lines);
    return lines;
  }

  /**
   * [animation 动画]
   * @param   {Number}  delta  [执行动画间隔时间]
   */
  animation(delta = 0.015) {
    //间隔时间>0.2不出现动画
    if (delta > 0.2) return;

    // 跳
    this.flyArr.forEach((elem) => {
      // 大于它则为动画完结 删除
      if (elem._been > elem._repeat) {
        elem.visible = false;
        if (typeof elem._callback === "function") {
          elem._callback(elem);
        }
        this.remove(elem);
      } else {
        const effect = elem.material.getEffect();
        if (!effect) return;
        let time = this.attrs[elem._flyId].time;
        // 完结一次 如果小于total 添加再更改
        // console.log(time)
        if (time < elem._total) {
          let newTime = this.attrs[elem._flyId].time;
          time = newTime + delta * (this.baicSpeed / delta) * elem._speed;
          // time = newTime;
        } else {
          elem._been += 1;
          time = -this.attrs[elem._flyId].length;
        }
        this.attrs[elem._flyId].time = time;
        elem.material.setFloat("time", time);
      }
    });
  }
  /**
   * [remove 删除]
   * @param   {Object}  mesh  [当前飞线]
   */
  remove(mesh) {
    // mesh.material.dispose();
    // mesh.geometry.dispose();
    this.flyArr = this.flyArr.filter((elem) => elem._flyId != mesh._flyId);
    mesh.parent.remove(mesh);
    mesh = null;
  }

  color(c) {
    if (!c) return new BABYLON.Color3();
    return BABYLON.Color3.FromHexString(c);
  }
  getColorArr(str) {
    if (Array.isArray(str)) return str; //error
    var _arr = [];
    str = str + "";
    str = str.toLowerCase().replace(/\s/g, "");
    if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
      var arr = str.replace(/rgba\(|\)/gi, "").split(",");
      var hex = [
        pad2(Math.round(arr[0] * 1 || 0).toString(16)),
        pad2(Math.round(arr[1] * 1 || 0).toString(16)),
        pad2(Math.round(arr[2] * 1 || 0).toString(16)),
      ];
      _arr[0] = this.color("#" + hex.join(""));
      _arr[1] = Math.max(0, Math.min(1, arr[3] * 1 || 0));
    } else if ("transparent" === str) {
      _arr[0] = this.color();
      _arr[1] = 0;
    } else {
      _arr[0] = this.color(str);
      _arr[1] = 1;
    }

    function pad2(c) {
      return c.length == 1 ? "0" + c : "" + c;
    }
    return _arr;
  }
}

export default FlyLineMesh;
```

#### 参考链接

[Threejs 实现炫酷 3D 地球|嘟先生](https://joy1412.cn/pages/threejsearth/#%E5%8A%A8%E6%80%81%E6%98%9F%E7%A9%BA%E8%83%8C%E6%99%AF%E4%BB%8B%E7%BB%8D)
[github 地址]
