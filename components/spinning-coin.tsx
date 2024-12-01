"use client"

import { useState, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useTexture, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

interface CoinProps {
  imageUrl: string
}

function Coin({ imageUrl }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(imageUrl)

  // Rotate the coin
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta
    }
  })

  return (
    <mesh ref={meshRef} scale={[2.5, 2.5, 2.5]}>
      <cylinderGeometry args={[2, 2, 0.2, 64]} />
      <meshStandardMaterial map={texture} attach="material-0" />
      <meshStandardMaterial map={texture} attach="material-1" />
      <meshStandardMaterial color="#66ffff" attach="material-2" />
    </mesh>
  )
}

export default function SpinningCoin() {
  const [imageUrl] = useState("/anime-coin.webp?height=200&width=200")

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md h-[400px] rounded-lg overflow-hidden">
        <Canvas camera={{ position: [0, 0, 9] }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} />
          <Coin imageUrl={imageUrl} />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>
    </div>
  )
}

