import { useEffect, useState, Suspense, useRef } from "react";
import { useMoralis } from "react-moralis";
import { BrowserRouter as Router, Switch, Route, NavLink, Redirect} from "react-router-dom";
import Account from "components/Account";
import NFTBalance from "components/NFTBalance";
import { Menu, Layout} from "antd";
import "antd/dist/antd.css";
import "./style.css";

import * as THREE from "three";
import { TextureLoader } from "three";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { MapControls, OrbitControls, Sky, Stars, TransformControls, useCubeTexture  } from "@react-three/drei";
import { Physics, Debug, useBox, usePlane } from "@react-three/cannon";
import { useDrag } from "react-use-gesture"

//======= HAND TRACKING ========================
import {Camera} from './camera';
import {STATE, MODEL_BACKEND_MAP, MEDIAPIPE_HANDS_CONFIG} from './params';
import * as mpHands from '@mediapipe/hands';
import * as handdetection from '@tensorflow-models/hand-pose-detection';
//===============================================

import MetalMap from "./assets/MetalMap.png";

const { Header } = Layout;

let cameras, camera;
let detector;
let startInferenceTime, numInferences = 0;
let inferenceTimeSum = 0, lastPanelUpdate = 0;

const styles = {
  content: {
    display: "flex",
    justifyContent: "right",
    fontFamily: "Roboto, sans-serif",
    color: "#041836",
    marginTop: "0px",
    marginRight: "80px",
    padding: "10px",
    overflow: "auto",
    height: "100px",
    width: "90%"
  },
  header: {
    position: "fixed", 
    zIndex: 1,
    width: "100%",
    height: "150px",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
    padding: "0 10px",
    boxShadow: "0 1px 10px rgb(151 164 175 / 10%)",
  },
  headerRight: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
    width: "10%"
  },
};


var currentCard = 1;

const Card1 = ({ defaultImage, initialPosition   }) => {
  /*console.log("CARD1: " + initialPosition )*/

  const [ref, api]  = useBox(() => ({mass: 1 , position: initialPosition, rotation: [-0.7, 0, 0], args: [25, 35, 1] }));
	const [theDefaultTexture] = useLoader(TextureLoader,[ MetalMap, MetalMap, MetalMap, MetalMap, MetalMap, MetalMap] )
  const [theNFTTexture] = useLoader(TextureLoader,[ defaultImage, defaultImage, defaultImage, defaultImage, defaultImage, defaultImage]  )

  return (
    <mesh castShadow  onClick={(e) => (e.stopPropagation(), console.log("CARD 1 CLIKED"), api.velocity.set(0, 100, 0))}  ref={ref}>
      <boxBufferGeometry attach="geometry" position={initialPosition} rotation={[-0.7, 0, 0]} args={[25, 35, 1]}/>
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theNFTTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
    </mesh>
	)
}

const Card2 = ({ defaultImage, initialPosition   }) => {

  const { size, viewport } = useThree();
  const [position, setPosition] = useState(initialPosition);
  const [quaternion, setQuaternion] = useState([0, 0, 0, 0]);
  const aspect = size.width / viewport.width;

  /*console.log("CARD2: " + position )*/

  const [ref, api]  = useBox(() => ({mass: 1 , position: position, rotation: [-0.7, 0, 0], args: [25, 35, 1] }));

  const bind = useDrag(({ offset: [,], xy: [x, y], first, last }) => {
    if (first) {
        api.mass.set(0);
    } else if (last) {
        api.mass.set(1);
    }
    api.position.set((x - size.width / 2) / aspect, -(y - size.height / 2) / aspect, 0);
  }, { pointerEvents: true });
 
	const [theDefaultTexture] = useLoader(TextureLoader,[ MetalMap, MetalMap, MetalMap, MetalMap, MetalMap, MetalMap] )
  const [theNFTTexture] = useLoader(TextureLoader,[ defaultImage, defaultImage, defaultImage, defaultImage, defaultImage, defaultImage]  )

	return (
		<mesh castShadow position={position} {...bind()} quaternion={quaternion} ref={ref} onClick={e => {e.stopPropagation();}}>
			<boxBufferGeometry attach="geometry" args={[25, 35, 1]}/>
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theNFTTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
		</mesh>
	)
}

//A horizontal surface that we can use as a table. This will be subtituted in AR with an actual surface
const Table = ({ defaultStart, defaultImage }) => {
  const[ref] = usePlane(() => ({position: [0, -50, 0], rotation:[-Math.PI / 2, 0,0 ], type: "static"}));

	// Lets add a cutom texture & material...
  THREE.TextureLoader.prototype.crossOrigin = ''
	const [metalMap] = useLoader(TextureLoader, [defaultImage])
  
	return (
		<mesh receiveShadow position={[0, -50, 0]} rotation = { [-Math.PI / 2, 0,0 ]}>
			<planeBufferGeometry attach="geometry" args={[1625, 1625]} receiveShadow />
			<meshStandardMaterial  attach="material" color="lightblue" />
		</mesh>
	)
}


const App = ({ isServerInfo }) => {
  const { isWeb3Enabled, enableWeb3, isAuthenticated, isWeb3EnableLoading } =
    useMoralis();

  const [inputValue, setInputValue] = useState("explore");

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);

  const [nftUrl1, setNftUrl1] = useState(MetalMap);
  const [nftUrl2, setNftUrl2] = useState(MetalMap);

  
  const nftUrlToParent = (nftImageUrl) => {  

    if( currentCard++ >= 2){ 
      console.log("CURRENT 1  " + currentCard );
      setNftUrl1(nftImageUrl);
      currentCard = 1;
    }
    else{
      console.log("CURRENT 2  " + currentCard );
      setNftUrl2(nftImageUrl);
    }
  }

  //=============================== HAND TRACK ===========================================//
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  
  async function getVideoInputs() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log('enumerateDevices() not supported.');
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices;
  }

  /*
  const getVideo = () => {
    navigator.mediaDevices
        .getUserMedia({
          video: { width: 1920, height: 1080 }
        })
        .then(stream => {
          let video = videoRef.current;
          video.srcObject = stream;
          video.play();
        })
        .catch(err => {
          console.error(err);
        })
  }
*/

  async function createDetector() {
    console.log( "Model : "  + STATE.model + " Type : " + STATE.modelConfig.type + "hands : "+ STATE.modelConfig.maxNumHands + " Version : " + mpHands.VERSION +  "Score " + STATE.modelConfig.scoreThreshold);
    switch (STATE.model) {
      case handdetection.SupportedModels.MediaPipeHands:
        const runtime = STATE.backend.split('-')[0];
        
        if (runtime === 'mediapipe') {
          console.log("Creating Media Detector " + runtime)
          detector = await handdetection.createDetector(STATE.model, {
            runtime,
            modelType: STATE.modelConfig.type,
            maxHands: STATE.modelConfig.maxNumHands,
            solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}`
          });

          console.log( "GOT IT? " + detector );
          return(detector);
        } 
        else if (runtime === 'tfjs') {
          return handdetection.createDetector(STATE.model, {
            runtime,
            modelType: STATE.modelConfig.type,
            maxHands: STATE.modelConfig.maxNumHands
          });
        }
    }

    console.log( "No detector" );
  }

  function beginEstimateHandsStats() {
    startInferenceTime = (performance || Date).now();
  }
  
  function endEstimateHandsStats() {
    const endInferenceTime = (performance || Date).now();
    inferenceTimeSum += endInferenceTime - startInferenceTime;
    ++numInferences;
  
    const panelUpdateMilliseconds = 1000;
    if (endInferenceTime - lastPanelUpdate >= panelUpdateMilliseconds) {
      const averageInferenceTime = inferenceTimeSum / numInferences;
      inferenceTimeSum = 0;
      numInferences = 0;
      //stats.customFpsPanel.update(
      //    1000.0 / averageInferenceTime, 120 /* maxValue */);
      lastPanelUpdate = endInferenceTime;
    }
  }
  
  async function renderPrediction(myCamera, myDetector) {
    console.log("Render Prediction Camera " + myCamera.video);
    console.log("Render Prediction Detector " + myDetector);

      if (myCamera.video.readyState < 2) {
        await new Promise((resolve) => {
          myCamera.video.onloadeddata = () => {
            resolve(myCamera.video);
          };
        });
      }
    
      let hands = null;
    
      // Detector can be null if initialization failed (for example when loading
      // from a URL that does not exist).
      if (myDetector != null) {
        // FPS only counts the time it takes to finish estimateHands.
        beginEstimateHandsStats();
    
        // Detectors can throw errors, for example when using custom URLs that
        // contain a model that doesn't provide the expected output.
        try {
          hands = await myDetector.estimateHands(
            myCamera.video,
              {flipHorizontal: false});
        } catch (error) {
          alert(error);
          myDetector.dispose();
          myDetector = null;
          
        }
    
        endEstimateHandsStats();
      }
    
      myCamera.drawCtx();
    
      // The null check makes sure the UI is not in the middle of changing to a
      // different model. If during model change, the result is from an old model,
      // which shouldn't be rendered.
      if (hands && hands.length > 0 && !STATE.isModelChanged) {
        myCamera.drawResults(hands);
      }

   // requestAnimationFrame(renderPrediction);
  };

  const getVideo = () => {
    cameras =  getVideoInputs();
    console.log( "VideoRef" + videoRef.current)

    STATE.model = handdetection.SupportedModels.MediaPipeHands;
    const backends = MODEL_BACKEND_MAP[STATE.model];
    // The first element of the array is the default backend for the model.
    STATE.backend = backends[0];
    STATE.modelConfig = {...MEDIAPIPE_HANDS_CONFIG};
    STATE.modelConfig.type = 'full';
    STATE.modelConfig.maxNumHands = 2;

    camera = Camera.setupCamera(STATE.camera, videoRef.current, canvasRef.current, canvasWrapRef.current).then( camera =>
    {
      console.log( "CAMERA " + camera + " " + camera.video)

      console.log( "GOT VIDEO !")
      detector = createDetector().then( test =>
        {
        renderPrediction(camera, detector);
        })

    })
  }

  useEffect(() => {
    getVideo();
  }, [videoRef, canvasRef]);



  //===============================================================================//

  return (
    <Layout style={{ height: "100vh", overflow: "auto" }}>
      <Router>
        <Header style={styles.header}>
          <Logo />
   
          <Menu
            theme="light"
            mode="horizontal"
            style={{
              display: "flex",
              fontSize: "17px",
              fontWeight: "500",
              marginLeft: "0px",
              width: "10%",
            }}
            defaultSelectedKeys={["nftMarket"]}
          >
            <Menu.Item key="nft">
              <NavLink to="/nftBalance">Your NFTs:</NavLink>
            </Menu.Item>

          </Menu>

       
        <div style={styles.content}>
          <Switch>
            <Route path="/nftBalance">
              <NFTBalance childToParent={nftUrlToParent}/>
            </Route>
          </Switch>
          <Redirect to="/NFTMarketPlace" />
        </div>

        <div style={styles.headerRight}>
            <Account />
          </div>

        </Header>
      </Router>

      <div ref={canvasWrapRef}>
        <canvas id="output" ref={canvasRef}/>
        <video id="video" ref={videoRef} playsInline style={{ width:"auto", height: "500px"}} />
      </div>

      <Canvas colorManagement shadowMap camera={{ position: [0, 0, 55], rotation: [-0.6,0,0], far: 1000 }}
        onCreated={({ gl}) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        >

			<Suspense fallback={null}>
      <ambientLight intensity={0.75} />
 				<Sky
					distance={45000000}
					sunPosition={[0, 1, 0]}
					inclination={0}
					azimuth={0.25}
				/>

				<Stars
					radius={500} // Radius of the inner sphere (default=100)
					depth={50} // Depth of area where stars should fit (default=50)
					count={5000} // Amount of stars (default=5000)
					factor={4} // Size factor (default=4)
					saturation={0} // Saturation 0-1 (default=0)
					fade // Faded dots (default=false)
				/>

      <directionalLight
        intensity={0.5}
        position={[20, 20, 20]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        castShadow
      />

        <Physics  gravity = {[0, -90.81, 0]}>
          <Card1 defaultImage={nftUrl1} initialPosition={[-30, -20, 0]}/>
          <Card2 defaultImage={nftUrl2} initialPosition={[30, -20, 0]}/>
          <Table defaultImage={MetalMap}/>
        </Physics>


			</Suspense>

      </Canvas>

    </Layout>
  );
};

//Moralis Logo here for the Hackathon
export const Logo = () => (
  <div style={{ display: "flex" }}>
    <svg
      width="60"
      height="38"
      viewBox="0 0 50 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M43.6871 32.3986C43.5973 32.4884 43.53 32.5782 43.4402 32.6905C43.53 32.6007 43.5973 32.5109 43.6871 32.3986Z"
        fill="black"
      />
      <path
        d="M49.7037 14.3715C49.5241 6.2447 42.7891 -0.17592 34.6624 0.00367768C31.0031 0.0934765 27.4784 1.53026 24.8294 4.06708C22.113 1.46291 18.4986 0.00367768 14.727 0.00367768C6.71246 0.00367768 0.202047 6.49164 0 14.5511V14.6633C0 20.8146 2.24497 26.2698 4.26545 30.0189C5.11853 31.5904 6.08387 33.117 7.13901 34.5762C7.5431 35.115 7.8574 35.564 8.10435 35.8559L8.39619 36.2151L8.48599 36.3273L8.50844 36.3498L8.53089 36.3722C10.2146 38.3253 13.1555 38.5498 15.1087 36.8886C15.1311 36.8661 15.1536 36.8437 15.176 36.8212C17.1291 35.0701 17.3312 32.0843 15.625 30.1087L15.6026 30.0638L15.423 29.8618C15.2658 29.6597 15.0189 29.3455 14.727 28.9414C13.9188 27.8189 13.178 26.6515 12.5269 25.4392C10.8881 22.4309 9.42888 18.6145 9.42888 14.7531C9.49623 11.8347 11.9432 9.52236 14.8617 9.58971C17.7128 9.65705 19.9802 11.9694 20.0251 14.8205C20.0476 15.5389 20.2272 16.2348 20.5415 16.8859C21.4844 19.3104 24.2232 20.5227 26.6478 19.5798C28.4438 18.8839 29.6336 17.1553 29.6561 15.2246V14.596C29.7683 11.6775 32.2153 9.38766 35.1562 9.47746C37.94 9.56726 40.1625 11.8122 40.2748 14.596C40.2523 17.6941 39.2645 20.7472 38.1421 23.1718C37.6931 24.1371 37.1992 25.08 36.6379 25.978C36.4359 26.3147 36.2787 26.5617 36.1665 26.6964C36.1216 26.7862 36.0767 26.8311 36.0542 26.8535L36.0318 26.876L35.9869 26.9433C37.6033 24.9004 40.5442 24.5412 42.5871 26.1576C44.4953 27.6617 44.9443 30.3781 43.6198 32.4211L43.6422 32.4435V32.3986L43.6647 32.3762L43.732 32.2864C43.7769 32.1966 43.8667 32.1068 43.9565 31.9721C44.1361 31.7027 44.3606 31.3435 44.6525 30.8945C45.3933 29.6822 46.0668 28.4026 46.673 27.1229C48.1097 24.0249 49.6812 19.5349 49.6812 14.5286L49.7037 14.3715Z"
        fill="#041836"
      />
      <path
        d="M39.7135 25.1249C37.1094 25.1025 34.9991 27.2127 34.9766 29.8169C34.9542 32.4211 37.0645 34.5313 39.6686 34.5538C41.1503 34.5538 42.5647 33.8578 43.4626 32.6905C43.53 32.6007 43.5973 32.4884 43.6871 32.3986C45.1015 30.221 44.4729 27.3025 42.2953 25.9107C41.532 25.3943 40.634 25.1249 39.7135 25.1249Z"
        fill="#B7E803"
      />
    </svg>

  </div>
);

export default App;
