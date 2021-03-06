import { useEffect, useState, Suspense, useRef } from "react";
import { useMoralis } from "react-moralis";
import { BrowserRouter as Router, Switch, Route, NavLink, Redirect} from "react-router-dom";
import Account from "components/Account";
import NFTBalance from "components/NFTBalance";
import { Menu, Layout} from "antd";
import "antd/dist/antd.css";
import "./style.css";

import * as THREE from "three";
import { TextureLoader, Vector3 } from "three";
import { Canvas, useLoader, useFrame, useThree, GLTFLoader } from "@react-three/fiber";
import { MapControls, OrbitControls, Sky, Stars, TransformControls, useCubeTexture  } from "@react-three/drei";
import { Physics, Debug, useBox, usePlane } from "@react-three/cannon";
import { useDrag } from "react-use-gesture"
import { useSpring, animated } from "@react-spring/three";

//===================================== HAND TRACKING ======================================
import { Hands, HAND_CONNECTIONS} from "@mediapipe/hands";
import { drawConnector, drawLandmarks } from "@mediapipe/drawing_utils";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";
//===========================================================================================

import MetalMap from "./assets/CardType2.jpg";
import LandingPage from "LandingPage";

//===================================== GAME ======================================
import GameManager from "components/GameManager/GameManager";
//===========================================================================================

var resetCard1 = false;
var resetCard2 = false;


const { Header } = Layout;


const Direction = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
  None: 'none'
} 

const CardStates = {
  WaitingForNFT: 'WaitingForNFT',
  WaitingForSlap: 'WaitingForSlap',
  ProcessingRound: 'ProcessingRound',
  ProcessingLostRound: 'ProcessingLostRound',
  ProcessingWonRound: 'ProcessingWonRound',
  None: 'None'
} 

var cardsState = CardStates.WaitingForNFT;
var prevCardsState = CardStates.None;
let positionVect;
let moveToLoc = new Vector3(0, 5, 0);

let prevAverage = 0; 
let averageY = 0;
let handVelocity = 0;
let handDirection = Direction.None;
let prevHandDirection = handDirection;
var prevTime = performance.now();

var currentCard = 1;

const MAX_HAND_VELO_Y = 12;
let slapCard1 = false;
let slapCard2 = false;

let nftsPicked = 0;


const Card1 = ({ defaultImage, initialPosition, initialMass   }) => {

  const spring = useSpring({
    loop: { reverse: false },
    from: { position: [-25, -50, 0] },
    to: { position: [-125, -35, 0] }
  });

  const spring2 = useSpring({
    loop: { reverse: false },
    from: { rotation: [-25, -50, 0] },
    to: { rotation: [0, 0, 0] }
  });


  console.log("CARD1: " + initialPosition )


  const [ref, api]  = useBox(() => ({mass: initialMass , position: initialPosition, rotation: [-0.7, 0, 0], args: [25, 35, 1] }));
	const [theDefaultTexture] = useLoader(TextureLoader,[ MetalMap, MetalMap, MetalMap, MetalMap, MetalMap, MetalMap] )
  const [theNFTTexture] = useLoader(TextureLoader,[ defaultImage, defaultImage, defaultImage, defaultImage, defaultImage, defaultImage]  )

  const pos = useRef([0,0,-1])
  const vel = useRef([0,0,0])
  const rot = useRef()
  useEffect(() => api.position.subscribe((p) => (pos.current = p)), [])
  useEffect(() => api.velocity.subscribe((v) => (vel.current = v)), [])
  useEffect(() => api.rotation.subscribe((r) => (rot.current = r)), [])

  function ApplySlap()
  {
    slapCard1 = false;
    console.log( " Slap happen " )
    if(  pos.current[1] < -49)
    {
      let force = handVelocity * -1 * 15000000;
      //console.log(  "VelFOR " +  force + " position " + ref.current.position.y  )

      let offsetX = ((Math.random() * 40) - 20 );
      let offsetY = ((Math.random() * 60) - 30 );

      api.applyLocalForce([force/2, force/2, force], [offsetX, offsetY, 0])

      cardsState = CardStates.ProcessingRound;
    }
  }

  function OnClicked()
  {
 //   api.applyLocalForce([0, 0, 35000], [20, 0, 0])
 //   console.log("CARD 1 CLIKED " + nftsPicked)
 //   if( nftsPicked === 2)
 //   {
 //     nftsPicked = 0;
 //     console.log("CARD 1 CLIKED " + nftsPicked)
 //     cardsState = CardStates.ProcessingRoundResolution;
 //
 //   }
  }

  function ApplyNFT()
  {
    console.log("APPLY NFT!!");
    nftsPicked = 0;
    cardsState = CardStates.WaitingForSlap;
  }

  const quater = useRef([0,0,0,0])
  useEffect(() => api.quaternion.subscribe((q) => (quater.current = q)), [])

  function CheckUpsideDown()
  {
      let velocityVect = new Vector3(vel.current[0])
      let length = velocityVect.length()

      if( length > 0.01 ) //We can check what happpen
      {
        let UpVector = new Vector3( 0, 0, 1);
        let rotatedVector = UpVector.applyQuaternion({x: quater.current[0], y: quater.current[1], z: quater.current[2], w: quater.current[3]})
       // console.log( rotatedVector ); // rot.current[2] );
        
        if( rotatedVector.y > 0)
        {
          cardsState = CardStates.ProcessingLostRound;
          console.log("IS UP");
          console.log( pos.current )
          spring.position.from = pos.current;
          velocity.set(0, 0, 0)
          angularVelocity.set(0, 0, 0)
        }
        else 
        {
          cardsState = CardStates.ProcessingWonRound;
          console.log("IS DOWN");
        }
      }
  }

  function  UpdateMoveToPlayesSide()
  {
//    console.log( spring.position.animation.values[0] )
    api.position.set(spring.position.animation.values[0].lastPosition, spring.position.animation.values[1].lastPosition, spring.position.animation.values[2].lastPosition  );
    
  }
  
  useFrame(() => {  
    
    if( cardsState === CardStates.WaitingForSlap )
    {
      if (slapCard1) {
        ApplySlap()
      }
    }

    if( nftsPicked === 2){

      ApplyNFT()
    }

   if( resetCard1 ){
      api.position.set( -25, -35, 0 )
      api.rotation.set( -0.7, 0, 0 )
      resetCard1 = false;
    }

    if( cardsState === CardStates.ProcessingRound)
    {
      CheckUpsideDown();
    }

    if( cardsState === CardStates.ProcessingLostRound )
    {
       UpdateMoveToPlayesSide();
    }

    if( prevCardsState !== cardsState)
    {
      console.log( cardsState );
    }

    prevCardsState = cardsState;

    slapCard1 = false;
  });
  
  return (
    <animated.mesh castShadow  onClick={(e) => (e.stopPropagation(), OnClicked())}  ref={ref}>
      <boxBufferGeometry attach="geometry" position={initialPosition} rotation={[-0.7, 0, 0]} args={[25, 35, 1]}/>
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theNFTTexture} metalness={0.5} side={THREE.DoubleSide} />
      <meshStandardMaterial attachArray="material" map={theDefaultTexture} metalness={0.5} side={THREE.DoubleSide} />
    </animated.mesh>
	)
}

const Card2 = ({ defaultImage, initialPosition, initialMass   }) => {
  
  const { size, viewport } = useThree();
  const [position, setPosition] = useState(initialPosition);
  const [quaternion, setQuaternion] = useState([0, 0, 0, 0]);
  const aspect = size.width / viewport.width;

  console.log("CARD2: " + position )

  const [ref, api]  = useBox(() => ({mass: initialMass, position: position, rotation: [-0.7, 0, 0], args: [25, 35, 1] }));

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

  const pos = useRef([0,0,-1])
  useEffect(() => api.position.subscribe((v) => (pos.current = v)), [])

  function ApplySlap()
  {
    slapCard2 = false;
    console.log( " Slap happen " )
    if(  pos.current[1] < -49)
    {
      let force = handVelocity * -1 * 15000000;
      console.log(  "VelFOR " +  force + " position " + ref.current.position.y  )

      let offsetX = ((Math.random() * 40) - 20 );
      let offsetY = ((Math.random() * 60) - 30 );

      console.log(  "Offset inX  " + offsetX  )

      api.applyLocalForce([force/2, force/2, force], [offsetX, offsetY, 0])
    }
  }


  useFrame(() => {

    if (slapCard2) {
      ApplySlap()
    }
    if( resetCard2 ){
      api.position.set( 25, -35, 0 )
      api.rotation.set( -0.7, 0, 0 )   
      resetCard2 = false;
    }
  });
  

  function OnClicked()
  {
    console.log("CARD 2 CLIKED " + nftsPicked)

    if( nftsPicked === 2)
    {
      nftsPicked = 0;
      console.log("Setting mass")
      api.mass.set(1)
    }
  }

  //	<mesh castShadow position={position} {...bind()} quaternion={quaternion} ref={ref} onClick={e => {e.stopPropagation();OnClicked()}}>

	return (
		<mesh castShadow position={position} {...bind()} quaternion={quaternion} ref={ref} onClick={e => {e.stopPropagation();OnClicked()}}>
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

const Appwww = ({ isServerInfo }) => {
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

    nftsPicked = nftsPicked + 1;

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

        if( prevHandDirection !== handDirection)
        {
            if( handDirection === Direction.Up )
            {
              slapCard1 = true;
              slapCard2 = true
            }
         //   console.log( "Hand is moving " + handDirection + " " + handVelocity)
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
      typeof webcamRef.current !== "undefined" && webcamRef.current !== null
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

  function handleClick() {
    console.log("clicked reset")
    resetCard1 = true;
    resetCard2 = true;
  }

  return (
    <div class="mian">
      <Router>
        <LandingPage onClickReset={handleClick}/>
        <Switch>
            <Route path="/nftBalance">
              <NFTBalance childToParent={nftUrlToParent}/>
            </Route>
          </Switch>
          <Redirect to="/NFTMarketPlace" />
      </Router>

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
            zindex: 999,
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
            zindex: 999,
            width: 500,
            height: 400,
          }}
        ></canvas>
      </div>  

<GameManager>
  </GameManager> 
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
 
        <Physics  gravity = {[0, -60.8, 0]}>
          <Card1 defaultImage={nftUrl1} initialPosition={[-25, -35, 0]} initialMass={30}/>
      
          <Table defaultImage={MetalMap}/>
        </Physics>

			</Suspense>

      </Canvas>
    
      </div>  


  );
};


export default App;
