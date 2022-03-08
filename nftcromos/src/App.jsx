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

//===================================== HAND TRACKING ======================================
import { Hands, HAND_CONNECTIONS} from "@mediapipe/hands";
import { drawConnector, drawLandmarks } from "@mediapipe/drawing_utils";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";
//===========================================================================================

//===================================== GAME ======================================

//===========================================================================================

import MetalMap from "./assets/CardType2.jpg";

let index = 0;

const { Header } = Layout;
 
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
    marginTop: "0px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
    width: "10%"
  },
};

const Direction = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
  None: 'none'
} 

let prevAverage = 0; 
let averageY = 0;
let handVelocity = 0;
let handDirection = Direction.None;
let prevHandDirection = handDirection;
var prevTime = performance.now();

var currentCard = 1;

const MAX_HAND_VELO_Y = 12;
let slap = false;

const Card1 = ({ defaultImage, initialPosition   }) => {

  console.log("CARD1: " + initialPosition )
 
  const [ref, api]  = useBox(() => ({mass: 1 , position: initialPosition, rotation: [-0.7, 0, 0], args: [25, 35, 1] }));
	const [theDefaultTexture] = useLoader(TextureLoader,[ MetalMap, MetalMap, MetalMap, MetalMap, MetalMap, MetalMap] )
  const [theNFTTexture] = useLoader(TextureLoader,[ defaultImage, defaultImage, defaultImage, defaultImage, defaultImage, defaultImage]  )

  const pos = useRef([0,0,-1])
  useEffect(() => api.position.subscribe((v) => (pos.current = v)), [])

  useFrame(() => {

    if (slap) {
      slap = false;
      console.log( " Slap happen " )
      if(  pos.current[1] < -49)
      {
        let force = handVelocity * -1 * 5000;
        console.log(  "Vel " +  force + " position " + ref.current.position.y  )
        api.velocity.set(0, 100, 0)
      }
    }
  });
  
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

  console.log("CARD2: " + position )

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
	const [metalMap] = useLoader(TextureLoader, [MetalMap])
  
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

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const connect = window.drawConnectors;

  var camera = null;


  function onResults(results) {
    //const video = webcamRef.current.video;
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    // Set canvas width
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );



    if (results.multiHandLandmarks) 
    {

      let handNum = 0;
      for (const landmarks of results.multiHandLandmarks) 
      {  
        handNum++;
        connect(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 4 });
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

        var totalY = 0;
        var i = 0;
        var landmark;
        for( i =0; i<landmarks.length ; i++)
        {
          landmark = landmarks[i];
          totalY = totalY + landmark.y;
        }   
        
        //Calcualte the average Y localtion of all the landmarks in the hand.
        averageY = totalY/landmarks.length;
     } 

      if( averageY > 0 && averageY < 1) //the the hand is in the screen we can calculate functionality related to the game
      {
        let currentTime = performance.now() ;

        let deltaY =  averageY - prevAverage
        let deltaTime = currentTime - prevTime; 

        handVelocity = deltaY / deltaTime;

        if( handVelocity > 0.001 )
          handDirection = Direction.Down;
        else if( handVelocity < -0.001 )
          handDirection = Direction.Up;
        else
          handDirection = Direction.None;

        if( prevHandDirection != handDirection)
        {
            if( handDirection == Direction.Up )
              slap = true;
            console.log( "Hand is moving " + handDirection + " " + handVelocity)
         //   console.log( "AVERAGE Y  " + averageY + " Prev " + prevAverage  + "Deltay" + deltaY);
        }

        //make sure the handVelocity does not go above a Max Value
        if( handVelocity > MAX_HAND_VELO_Y)
          handVelocity = MAX_HAND_VELO_Y;

        prevAverage = averageY;
        prevHandDirection = handDirection;
        prevTime = currentTime;
      }
  
    }
    canvasCtx.restore();

  }

  useEffect(() => {
    
      index = 0;

      const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }});

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: false
      });
      hands.onResults(onResults);
      
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      console.log("Creating a new camera")
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await hands.send( { image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

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

        <div className="App" >
        <Webcam ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "0",
            marginTop: "300",
            left: 0,
            right: 0,
            textAlign: "left",
            zindex: 500,
            width: 500,
            height: 400,
          }}
        />{" "}
        <canvas ref={canvasRef} className="output_canvas"
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "0",
            marginTop: "300",
            left: 0,
            right: 0,
            textAlign: "left",
            zindex: 500,
            width: 500,
            height: 400,
          }}
        ></canvas>
      </div>  


    </Header>
      </Router>
 
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
