package com.mangsang.app.core

import org.junit.Assert.assertEquals
import org.junit.Test

class MomentDetectorTest {
    private fun detect(gear: Gear?, moving: Boolean?) = MomentDetector.detect(VehicleSnapshot(gear, moving))

    @Test fun parkedWhenGearP() = assertEquals(Moment.PARKED, detect(Gear.P, false))
    @Test fun stoppedWhenInDriveButStill() = assertEquals(Moment.STOPPED, detect(Gear.D, false))
    @Test fun stoppedInNeutral() = assertEquals(Moment.STOPPED, detect(Gear.N, false))
    @Test fun drivingWhenMoving() = assertEquals(Moment.DRIVING, detect(Gear.D, true))
    @Test fun reverseIsRestrictedLikeDriving() = assertEquals(Moment.DRIVING, detect(Gear.R, false))
    @Test fun missingGearMeansDriving() = assertEquals(Moment.DRIVING, detect(null, false))
    @Test fun missingMotionMeansDriving() = assertEquals(Moment.DRIVING, detect(Gear.P, null))
}
