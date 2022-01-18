import React from "react";

import { Page, ThreeSceneRouter } from "Components";
import { ControlsPanel } from "Components/ControlsPanel";

type Props = {};

const HomeLayout = (props: Props) => {
	return (
		<Page title="Home">
			<ThreeSceneRouter />
			<ControlsPanel />
		</Page>
	);
};

export { HomeLayout };
