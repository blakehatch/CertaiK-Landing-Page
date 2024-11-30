'use client'

import React from 'react';
import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

function Coin() {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load('/anime-coin.webp')
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.y %= Math.PI * 2 // Ensure the rotation doesn't exceed 360 degrees
    }
  })

  return (
    <mesh ref={meshRef} scale={[1, 1, 1]}> {/* Scale up two times */}
      <meshStandardMaterial
        color="#1a1a1a"
        metalness={0.9}
        roughness={0.1}
        emissive="#0ff"
        emissiveIntensity={0.2}
      />
      <mesh position={[0, 0.101, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      <mesh position={[0, -0.101, 0]} rotation={[Math.PI, 0, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </mesh>
  )
}

export function SpinningCoin() {
  return (
    <div className="w-full h-[400px] relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-lg pointer-events-none" />
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Coin />
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}

