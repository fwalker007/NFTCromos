import React from 'react';

class GameCard extends React.Component {

  constructor(props) {
    super(props);
    this.state = {date: new Date()};
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {

    console.log(this.props.nftUrl)

  	return (
      <mesh position={[-5, 0, 5]}>       
        <planeBufferGeometry attach="geometry" args={[25, 25]} />
			  <meshStandardMaterial attach="material" map={this.props.nftUrl} metalness={0.5} />
      </mesh>
    )
  }

}

export default GameCard;