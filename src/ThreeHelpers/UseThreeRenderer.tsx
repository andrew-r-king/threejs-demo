import * as dat from "dat.gui";
import debounce from "lodash/debounce";
import { useCallback, useState } from "react";
import React from "react";
import styled from "styled-components";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";

import { ClassType, Optional } from "@andrew-r-king/react-kitchen";

import { useResize } from "Hooks";

import { ThreeBase, ThreeSceneOptions } from "./ThreeBase";

const RendererStyles = styled.div`
	display: block;
	position: relative;
	background: #181132;
	width: 100%;
	height: 100%;
`;

export type RenderSettings = THREE.WebGLRendererParameters & Partial<ThreeSceneOptions>;

export type ThreeRendererResult<T extends ThreeBase> = {
	ThreeRenderer: React.FunctionComponent<{}>;
	program: T;
};

function useThreeRenderer<T extends ThreeBase>(
	ProgramConstructor: ClassType<T>,
	settings: RenderSettings = {
		alpha: true,
		premultipliedAlpha: true,
		antialias: false,
		showStats: false,
	}
): ThreeRendererResult<T> {
	// Everything is created on the first render, so state is mutable
	let [renderer] = useState<Optional<THREE.WebGLRenderer>>(null);

	let [program] = useState<Optional<T>>(null);
	let [gui] = useState<Optional<dat.GUI>>(null);
	let [stats] = useState<Optional<Stats>>(null);

	useResize(
		debounce((ev) => {
			const { width, height } = settings;
			if (!!renderer && !!program && !width && !height) {
				program.setSize?.(window.innerWidth, window.innerHeight);
				renderer.setSize(window.innerWidth, window.innerHeight);
			}
		}, 500),
		[program]
	);

	const ref = useCallback((node: Optional<HTMLDivElement>) => {
		// console.log("ref called");
		if (!!program) {
			// console.log("destroy");
			if (!!gui) {
				gui.destroy();
				gui = null;
			}

			program.dispose?.();
			program = null;

			if (!!renderer) {
				renderer.dispose();
				renderer = null;
			}
		}

		if (!!node) {
			// console.log("create");
			let scene = new THREE.Scene();

			let { width, height, showStats, ...renderParameters } = settings;
			width = width ?? window.innerWidth;
			height = height ?? window.innerHeight;

			program = new ProgramConstructor(scene, {
				width,
				height,
				showStats,
			});

			renderer = new THREE.WebGLRenderer(renderParameters);
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(width, height);
			renderer.setAnimationLoop(() => {
				if (!!program && !!renderer) {
					program.onUpdate();
					program.onDraw(renderer);
				}
				if (!!stats) {
					stats.update();
				}
			});
			program.onCreateRenderer?.(renderer);

			node.replaceChildren(renderer.domElement);

			if (!!program.onMakeGui) {
				const { GUI } = require("dat.gui");
				if (gui === null) {
					gui = new GUI();
					if (!!gui) {
						program.onMakeGui(gui);
					}
				}
			}

			program.onCreateControls(renderer.domElement);

			if (showStats) {
				stats = Stats();
				stats.domElement.className = "three-stats";
				node.appendChild(stats.dom);
			}
		}
	}, []);

	const ThreeRenderer = useCallback(() => <RendererStyles ref={ref} />, [ref]);

	return {
		ThreeRenderer,
		program: program!,
	};
}

export { useThreeRenderer };
