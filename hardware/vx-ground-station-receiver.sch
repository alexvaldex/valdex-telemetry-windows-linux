<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE eagle SYSTEM "eagle.dtd">
<eagle version="9.6.2">
<drawing>
<settings>
<setting alwaysvectorfont="no"/>
<setting verticaltext="up"/>
</settings>
<grid distance="0.1" unitdist="inch" unit="inch" style="lines" multiple="1" display="no" altdistance="0.01" altunitdist="inch" altunit="inch"/>
<layers>
<layer number="1" name="Top" color="4" fill="1" visible="yes" active="yes"/>
<layer number="16" name="Bottom" color="1" fill="1" visible="yes" active="yes"/>
<layer number="17" name="Pads" color="2" fill="1" visible="yes" active="yes"/>
<layer number="18" name="Vias" color="2" fill="1" visible="yes" active="yes"/>
<layer number="19" name="Unrouted" color="6" fill="1" visible="yes" active="yes"/>
<layer number="20" name="Dimension" color="24" fill="1" visible="yes" active="yes"/>
<layer number="21" name="tPlace" color="7" fill="1" visible="yes" active="yes"/>
<layer number="22" name="bPlace" color="7" fill="1" visible="yes" active="yes"/>
<layer number="23" name="tOrigins" color="15" fill="1" visible="yes" active="yes"/>
<layer number="24" name="bOrigins" color="15" fill="1" visible="yes" active="yes"/>
<layer number="25" name="tNames" color="7" fill="1" visible="yes" active="yes"/>
<layer number="26" name="bNames" color="7" fill="1" visible="yes" active="yes"/>
<layer number="27" name="tValues" color="7" fill="1" visible="yes" active="yes"/>
<layer number="28" name="bValues" color="7" fill="1" visible="yes" active="yes"/>
<layer number="29" name="tStop" color="7" fill="3" visible="no" active="yes"/>
<layer number="30" name="bStop" color="7" fill="6" visible="no" active="yes"/>
<layer number="44" name="Drills" color="7" fill="1" visible="no" active="yes"/>
<layer number="45" name="Holes" color="7" fill="1" visible="no" active="yes"/>
<layer number="51" name="tDocu" color="7" fill="1" visible="yes" active="yes"/>
<layer number="52" name="bDocu" color="7" fill="1" visible="yes" active="yes"/>
<layer number="91" name="Nets" color="2" fill="1" visible="yes" active="yes"/>
<layer number="92" name="Busses" color="1" fill="1" visible="yes" active="yes"/>
<layer number="93" name="Pins" color="2" fill="1" visible="no" active="yes"/>
<layer number="94" name="Symbols" color="4" fill="1" visible="yes" active="yes"/>
<layer number="95" name="Names" color="7" fill="1" visible="yes" active="yes"/>
<layer number="96" name="Values" color="7" fill="1" visible="yes" active="yes"/>
<layer number="97" name="Info" color="7" fill="1" visible="yes" active="yes"/>
<layer number="98" name="Guide" color="6" fill="1" visible="yes" active="yes"/>
</layers>
<schematic xreflabel="%F%N/%S.%C%R" xrefpart="/%S.%C%R">
<libraries>
<library name="VX">
<description>VX Ground Station Receiver - PLACEHOLDER parts. Replace footprints with verified SnapEDA/Ultra Librarian parts before layout.</description>
<packages>
<package name="PLCH-1">
<description>PLACEHOLDER 1-pad - replace with real footprint</description>
<pad name="1" x="0" y="0" drill="0.6" diameter="1.4"/>
<text x="-1" y="1.6" size="1" layer="25">&gt;NAME</text>
</package>
<package name="PLCH-2">
<description>PLACEHOLDER 2-pad</description>
<pad name="1" x="0" y="0" drill="0.6" diameter="1.4"/>
<pad name="2" x="2.54" y="0" drill="0.6" diameter="1.4"/>
<text x="-1" y="1.6" size="1" layer="25">&gt;NAME</text>
</package>
<package name="PLCH-5">
<description>PLACEHOLDER 5-pad (e.g. SOT-23-5 LDO)</description>
<pad name="1" x="0" y="0" drill="0.6" diameter="1.4"/>
<pad name="2" x="2.54" y="0" drill="0.6" diameter="1.4"/>
<pad name="3" x="5.08" y="0" drill="0.6" diameter="1.4"/>
<pad name="4" x="7.62" y="0" drill="0.6" diameter="1.4"/>
<pad name="5" x="10.16" y="0" drill="0.6" diameter="1.4"/>
<text x="-1" y="1.6" size="1" layer="25">&gt;NAME</text>
</package>
<package name="PLCH-6">
<description>PLACEHOLDER 6-pad (e.g. USB-C simplified)</description>
<pad name="1" x="0" y="0" drill="0.6" diameter="1.4"/>
<pad name="2" x="2.54" y="0" drill="0.6" diameter="1.4"/>
<pad name="3" x="5.08" y="0" drill="0.6" diameter="1.4"/>
<pad name="4" x="7.62" y="0" drill="0.6" diameter="1.4"/>
<pad name="5" x="10.16" y="0" drill="0.6" diameter="1.4"/>
<pad name="6" x="12.7" y="0" drill="0.6" diameter="1.4"/>
<text x="-1" y="1.6" size="1" layer="25">&gt;NAME</text>
</package>
<package name="PLCH-8">
<description>PLACEHOLDER 8-pad (e.g. SOIC-8 flash)</description>
<pad name="1" x="0" y="0" drill="0.6" diameter="1.4"/>
<pad name="2" x="2.54" y="0" drill="0.6" diameter="1.4"/>
<pad name="3" x="5.08" y="0" drill="0.6" diameter="1.4"/>
<pad name="4" x="7.62" y="0" drill="0.6" diameter="1.4"/>
<pad name="5" x="10.16" y="0" drill="0.6" diameter="1.4"/>
<pad name="6" x="12.7" y="0" drill="0.6" diameter="1.4"/>
<pad name="7" x="15.24" y="0" drill="0.6" diameter="1.4"/>
<pad name="8" x="17.78" y="0" drill="0.6" diameter="1.4"/>
<text x="-1" y="1.6" size="1" layer="25">&gt;NAME</text>
</package>
<package name="PLCH-10">
<description>PLACEHOLDER 10-pad (e.g. LoRa module core pins)</description>
<pad name="1" x="0" y="0" drill="0.6" diameter="1.4"/>
<pad name="2" x="2.54" y="0" drill="0.6" diameter="1.4"/>
<pad name="3" x="5.08" y="0" drill="0.6" diameter="1.4"/>
<pad name="4" x="7.62" y="0" drill="0.6" diameter="1.4"/>
<pad name="5" x="10.16" y="0" drill="0.6" diameter="1.4"/>
<pad name="6" x="12.7" y="0" drill="0.6" diameter="1.4"/>
<pad name="7" x="15.24" y="0" drill="0.6" diameter="1.4"/>
<pad name="8" x="17.78" y="0" drill="0.6" diameter="1.4"/>
<pad name="9" x="20.32" y="0" drill="0.6" diameter="1.4"/>
<pad name="10" x="22.86" y="0" drill="0.6" diameter="1.4"/>
<text x="-1" y="1.6" size="1" layer="25">&gt;NAME</text>
</package>
<package name="PLCH-20">
<description>PLACEHOLDER 20-pad (e.g. RP2040 used pins)</description>
<pad name="1" x="0" y="0" drill="0.6" diameter="1.4"/>
<pad name="2" x="2.54" y="0" drill="0.6" diameter="1.4"/>
<pad name="3" x="5.08" y="0" drill="0.6" diameter="1.4"/>
<pad name="4" x="7.62" y="0" drill="0.6" diameter="1.4"/>
<pad name="5" x="10.16" y="0" drill="0.6" diameter="1.4"/>
<pad name="6" x="12.7" y="0" drill="0.6" diameter="1.4"/>
<pad name="7" x="15.24" y="0" drill="0.6" diameter="1.4"/>
<pad name="8" x="17.78" y="0" drill="0.6" diameter="1.4"/>
<pad name="9" x="20.32" y="0" drill="0.6" diameter="1.4"/>
<pad name="10" x="22.86" y="0" drill="0.6" diameter="1.4"/>
<pad name="11" x="25.4" y="0" drill="0.6" diameter="1.4"/>
<pad name="12" x="27.94" y="0" drill="0.6" diameter="1.4"/>
<pad name="13" x="30.48" y="0" drill="0.6" diameter="1.4"/>
<pad name="14" x="33.02" y="0" drill="0.6" diameter="1.4"/>
<pad name="15" x="35.56" y="0" drill="0.6" diameter="1.4"/>
<pad name="16" x="38.1" y="0" drill="0.6" diameter="1.4"/>
<pad name="17" x="40.64" y="0" drill="0.6" diameter="1.4"/>
<pad name="18" x="43.18" y="0" drill="0.6" diameter="1.4"/>
<pad name="19" x="45.72" y="0" drill="0.6" diameter="1.4"/>
<pad name="20" x="48.26" y="0" drill="0.6" diameter="1.4"/>
<text x="-1" y="1.6" size="1" layer="25">&gt;NAME</text>
</package>
</packages>
<symbols>
<symbol name="ANT">
<pin name="SIG" x="0" y="0" visible="pin" length="short" direction="pas"/>
<wire x1="2.54" y1="0" x2="5.08" y2="0" width="0.254" layer="94"/>
<wire x1="5.08" y1="2.54" x2="5.08" y2="-2.54" width="0.254" layer="94"/>
<wire x1="5.08" y1="2.54" x2="7.62" y2="0" width="0.254" layer="94"/>
<wire x1="5.08" y1="-2.54" x2="7.62" y2="0" width="0.254" layer="94"/>
<text x="2.54" y="3" size="1.778" layer="95">&gt;NAME</text>
</symbol>
<symbol name="RES">
<pin name="1" x="0" y="0" visible="pad" length="short" direction="pas"/>
<pin name="2" x="0" y="-2.54" visible="pad" length="short" direction="pas"/>
<wire x1="2.54" y1="1.016" x2="7.62" y2="1.016" width="0.254" layer="94"/>
<wire x1="7.62" y1="1.016" x2="7.62" y2="-3.556" width="0.254" layer="94"/>
<wire x1="7.62" y1="-3.556" x2="2.54" y2="-3.556" width="0.254" layer="94"/>
<wire x1="2.54" y1="-3.556" x2="2.54" y2="1.016" width="0.254" layer="94"/>
<text x="9" y="0" size="1.778" layer="95">&gt;NAME</text>
<text x="9" y="-3" size="1.778" layer="96">&gt;VALUE</text>
</symbol>
<symbol name="LORA">
<pin name="VCC" x="0" y="0" visible="pin" length="short" direction="pwr"/>
<pin name="GND" x="0" y="-2.54" visible="pin" length="short" direction="pwr"/>
<pin name="NSS" x="0" y="-5.08" visible="pin" length="short" direction="pas"/>
<pin name="SCK" x="0" y="-7.62" visible="pin" length="short" direction="pas"/>
<pin name="MOSI" x="0" y="-10.16" visible="pin" length="short" direction="pas"/>
<pin name="MISO" x="0" y="-12.7" visible="pin" length="short" direction="pas"/>
<pin name="BUSY" x="0" y="-15.24" visible="pin" length="short" direction="pas"/>
<pin name="DIO1" x="0" y="-17.78" visible="pin" length="short" direction="pas"/>
<pin name="NRST" x="0" y="-20.32" visible="pin" length="short" direction="pas"/>
<pin name="ANT" x="0" y="-22.86" visible="pin" length="short" direction="pas"/>
<wire x1="2.54" y1="1.27" x2="20.32" y2="1.27" width="0.254" layer="94"/>
<wire x1="20.32" y1="1.27" x2="20.32" y2="-24.13" width="0.254" layer="94"/>
<wire x1="20.32" y1="-24.13" x2="2.54" y2="-24.13" width="0.254" layer="94"/>
<wire x1="2.54" y1="-24.13" x2="2.54" y2="1.27" width="0.254" layer="94"/>
<text x="2.54" y="2" size="1.778" layer="95">&gt;NAME</text>
<text x="5" y="-12" size="1.778" layer="94">SX1262</text>
</symbol>
<symbol name="RP2040">
<pin name="IOVDD" x="0" y="0" visible="pin" length="short" direction="pwr"/>
<pin name="GND" x="0" y="-2.54" visible="pin" length="short" direction="pwr"/>
<pin name="GP2_SCK" x="0" y="-5.08" visible="pin" length="short" direction="pas"/>
<pin name="GP3_MOSI" x="0" y="-7.62" visible="pin" length="short" direction="pas"/>
<pin name="GP4_MISO" x="0" y="-10.16" visible="pin" length="short" direction="pas"/>
<pin name="GP5_NSS" x="0" y="-12.7" visible="pin" length="short" direction="pas"/>
<pin name="GP6_BUSY" x="0" y="-15.24" visible="pin" length="short" direction="pas"/>
<pin name="GP7_DIO1" x="0" y="-17.78" visible="pin" length="short" direction="pas"/>
<pin name="GP8_NRST" x="0" y="-20.32" visible="pin" length="short" direction="pas"/>
<pin name="USB_DP" x="0" y="-22.86" visible="pin" length="short" direction="pas"/>
<pin name="USB_DM" x="0" y="-25.4" visible="pin" length="short" direction="pas"/>
<pin name="QSPI_CS" x="0" y="-27.94" visible="pin" length="short" direction="pas"/>
<pin name="QSPI_SCK" x="0" y="-30.48" visible="pin" length="short" direction="pas"/>
<pin name="QSPI_SD0" x="0" y="-33.02" visible="pin" length="short" direction="pas"/>
<pin name="QSPI_SD1" x="0" y="-35.56" visible="pin" length="short" direction="pas"/>
<pin name="QSPI_SD2" x="0" y="-38.1" visible="pin" length="short" direction="pas"/>
<pin name="QSPI_SD3" x="0" y="-40.64" visible="pin" length="short" direction="pas"/>
<pin name="RUN" x="0" y="-43.18" visible="pin" length="short" direction="pas"/>
<pin name="XIN" x="0" y="-45.72" visible="pin" length="short" direction="pas"/>
<pin name="XOUT" x="0" y="-48.26" visible="pin" length="short" direction="pas"/>
<wire x1="2.54" y1="1.27" x2="25.4" y2="1.27" width="0.254" layer="94"/>
<wire x1="25.4" y1="1.27" x2="25.4" y2="-49.53" width="0.254" layer="94"/>
<wire x1="25.4" y1="-49.53" x2="2.54" y2="-49.53" width="0.254" layer="94"/>
<wire x1="2.54" y1="-49.53" x2="2.54" y2="1.27" width="0.254" layer="94"/>
<text x="2.54" y="2" size="1.778" layer="95">&gt;NAME</text>
<text x="7" y="-24" size="1.778" layer="94">RP2040</text>
</symbol>
<symbol name="FLASH">
<pin name="CS" x="0" y="0" visible="pin" length="short" direction="pas"/>
<pin name="DO" x="0" y="-2.54" visible="pin" length="short" direction="pas"/>
<pin name="WP" x="0" y="-5.08" visible="pin" length="short" direction="pas"/>
<pin name="GND" x="0" y="-7.62" visible="pin" length="short" direction="pwr"/>
<pin name="DI" x="0" y="-10.16" visible="pin" length="short" direction="pas"/>
<pin name="CLK" x="0" y="-12.7" visible="pin" length="short" direction="pas"/>
<pin name="HOLD" x="0" y="-15.24" visible="pin" length="short" direction="pas"/>
<pin name="VCC" x="0" y="-17.78" visible="pin" length="short" direction="pwr"/>
<wire x1="2.54" y1="1.27" x2="17.78" y2="1.27" width="0.254" layer="94"/>
<wire x1="17.78" y1="1.27" x2="17.78" y2="-19.05" width="0.254" layer="94"/>
<wire x1="17.78" y1="-19.05" x2="2.54" y2="-19.05" width="0.254" layer="94"/>
<wire x1="2.54" y1="-19.05" x2="2.54" y2="1.27" width="0.254" layer="94"/>
<text x="2.54" y="2" size="1.778" layer="95">&gt;NAME</text>
<text x="4" y="-9" size="1.778" layer="94">W25Q128</text>
</symbol>
<symbol name="LDO">
<pin name="VIN" x="0" y="0" visible="pin" length="short" direction="pwr"/>
<pin name="GND" x="0" y="-2.54" visible="pin" length="short" direction="pwr"/>
<pin name="EN" x="0" y="-5.08" visible="pin" length="short" direction="pas"/>
<pin name="NC" x="0" y="-7.62" visible="pin" length="short" direction="nc"/>
<pin name="VOUT" x="0" y="-10.16" visible="pin" length="short" direction="pwr"/>
<wire x1="2.54" y1="1.27" x2="17.78" y2="1.27" width="0.254" layer="94"/>
<wire x1="17.78" y1="1.27" x2="17.78" y2="-11.43" width="0.254" layer="94"/>
<wire x1="17.78" y1="-11.43" x2="2.54" y2="-11.43" width="0.254" layer="94"/>
<wire x1="2.54" y1="-11.43" x2="2.54" y2="1.27" width="0.254" layer="94"/>
<text x="2.54" y="2" size="1.778" layer="95">&gt;NAME</text>
<text x="4" y="-6" size="1.778" layer="94">3V3 LDO</text>
</symbol>
<symbol name="USBC">
<pin name="VBUS" x="0" y="0" visible="pin" length="short" direction="pwr"/>
<pin name="GND" x="0" y="-2.54" visible="pin" length="short" direction="pwr"/>
<pin name="DP" x="0" y="-5.08" visible="pin" length="short" direction="pas"/>
<pin name="DM" x="0" y="-7.62" visible="pin" length="short" direction="pas"/>
<pin name="CC1" x="0" y="-10.16" visible="pin" length="short" direction="pas"/>
<pin name="CC2" x="0" y="-12.7" visible="pin" length="short" direction="pas"/>
<wire x1="2.54" y1="1.27" x2="17.78" y2="1.27" width="0.254" layer="94"/>
<wire x1="17.78" y1="1.27" x2="17.78" y2="-13.97" width="0.254" layer="94"/>
<wire x1="17.78" y1="-13.97" x2="2.54" y2="-13.97" width="0.254" layer="94"/>
<wire x1="2.54" y1="-13.97" x2="2.54" y2="1.27" width="0.254" layer="94"/>
<text x="2.54" y="2" size="1.778" layer="95">&gt;NAME</text>
<text x="4" y="-7" size="1.778" layer="94">USB-C</text>
</symbol>
</symbols>
<devicesets>
<deviceset name="ANTENNA" prefix="ANT">
<description>Antenna connector - PLACEHOLDER, use SMA/u.FL footprint</description>
<gates><gate name="G$1" symbol="ANT" x="0" y="0"/></gates>
<devices><device name="" package="PLCH-1">
<connects><connect gate="G$1" pin="SIG" pad="1"/></connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="R" prefix="R" uservalue="yes">
<description>Resistor - PLACEHOLDER, use 0402</description>
<gates><gate name="G$1" symbol="RES" x="0" y="0"/></gates>
<devices><device name="" package="PLCH-2">
<connects><connect gate="G$1" pin="1" pad="1"/><connect gate="G$1" pin="2" pad="2"/></connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="SX1262_MODULE" prefix="U">
<description>LoRa module (Ebyte E22-900M / SX1262) - PLACEHOLDER footprint</description>
<gates><gate name="G$1" symbol="LORA" x="0" y="0"/></gates>
<devices><device name="" package="PLCH-10">
<connects>
<connect gate="G$1" pin="VCC" pad="1"/>
<connect gate="G$1" pin="GND" pad="2"/>
<connect gate="G$1" pin="NSS" pad="3"/>
<connect gate="G$1" pin="SCK" pad="4"/>
<connect gate="G$1" pin="MOSI" pad="5"/>
<connect gate="G$1" pin="MISO" pad="6"/>
<connect gate="G$1" pin="BUSY" pad="7"/>
<connect gate="G$1" pin="DIO1" pad="8"/>
<connect gate="G$1" pin="NRST" pad="9"/>
<connect gate="G$1" pin="ANT" pad="10"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="RP2040" prefix="U">
<description>RP2040 MCU (used pins only) - PLACEHOLDER footprint</description>
<gates><gate name="G$1" symbol="RP2040" x="0" y="0"/></gates>
<devices><device name="" package="PLCH-20">
<connects>
<connect gate="G$1" pin="IOVDD" pad="1"/>
<connect gate="G$1" pin="GND" pad="2"/>
<connect gate="G$1" pin="GP2_SCK" pad="3"/>
<connect gate="G$1" pin="GP3_MOSI" pad="4"/>
<connect gate="G$1" pin="GP4_MISO" pad="5"/>
<connect gate="G$1" pin="GP5_NSS" pad="6"/>
<connect gate="G$1" pin="GP6_BUSY" pad="7"/>
<connect gate="G$1" pin="GP7_DIO1" pad="8"/>
<connect gate="G$1" pin="GP8_NRST" pad="9"/>
<connect gate="G$1" pin="USB_DP" pad="10"/>
<connect gate="G$1" pin="USB_DM" pad="11"/>
<connect gate="G$1" pin="QSPI_CS" pad="12"/>
<connect gate="G$1" pin="QSPI_SCK" pad="13"/>
<connect gate="G$1" pin="QSPI_SD0" pad="14"/>
<connect gate="G$1" pin="QSPI_SD1" pad="15"/>
<connect gate="G$1" pin="QSPI_SD2" pad="16"/>
<connect gate="G$1" pin="QSPI_SD3" pad="17"/>
<connect gate="G$1" pin="RUN" pad="18"/>
<connect gate="G$1" pin="XIN" pad="19"/>
<connect gate="G$1" pin="XOUT" pad="20"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="W25Q128" prefix="U">
<description>QSPI flash SOIC-8 - PLACEHOLDER footprint</description>
<gates><gate name="G$1" symbol="FLASH" x="0" y="0"/></gates>
<devices><device name="" package="PLCH-8">
<connects>
<connect gate="G$1" pin="CS" pad="1"/>
<connect gate="G$1" pin="DO" pad="2"/>
<connect gate="G$1" pin="WP" pad="3"/>
<connect gate="G$1" pin="GND" pad="4"/>
<connect gate="G$1" pin="DI" pad="5"/>
<connect gate="G$1" pin="CLK" pad="6"/>
<connect gate="G$1" pin="HOLD" pad="7"/>
<connect gate="G$1" pin="VCC" pad="8"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="LDO33" prefix="U">
<description>3.3V LDO SOT-23-5 (AP2112K) - PLACEHOLDER footprint</description>
<gates><gate name="G$1" symbol="LDO" x="0" y="0"/></gates>
<devices><device name="" package="PLCH-5">
<connects>
<connect gate="G$1" pin="VIN" pad="1"/>
<connect gate="G$1" pin="GND" pad="2"/>
<connect gate="G$1" pin="EN" pad="3"/>
<connect gate="G$1" pin="NC" pad="4"/>
<connect gate="G$1" pin="VOUT" pad="5"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="USB_C" prefix="J">
<description>USB-C receptacle (simplified) - PLACEHOLDER footprint</description>
<gates><gate name="G$1" symbol="USBC" x="0" y="0"/></gates>
<devices><device name="" package="PLCH-6">
<connects>
<connect gate="G$1" pin="VBUS" pad="1"/>
<connect gate="G$1" pin="GND" pad="2"/>
<connect gate="G$1" pin="DP" pad="3"/>
<connect gate="G$1" pin="DM" pad="4"/>
<connect gate="G$1" pin="CC1" pad="5"/>
<connect gate="G$1" pin="CC2" pad="6"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
</devicesets>
</library>
</libraries>
<attributes/>
<variantdefs/>
<classes>
<class number="0" name="default" width="0" drill="0"/>
</classes>
<parts>
<part name="ANT1" library="VX" deviceset="ANTENNA" device=""/>
<part name="U1" library="VX" deviceset="SX1262_MODULE" device=""/>
<part name="U2" library="VX" deviceset="RP2040" device=""/>
<part name="U3" library="VX" deviceset="W25Q128" device=""/>
<part name="U4" library="VX" deviceset="LDO33" device=""/>
<part name="J1" library="VX" deviceset="USB_C" device=""/>
<part name="R1" library="VX" deviceset="R" device="" value="5.1k"/>
<part name="R2" library="VX" deviceset="R" device="" value="5.1k"/>
</parts>
<sheets>
<sheet>
<plain>
<text x="20" y="175" size="2.54" layer="97">VX Ground Station Receiver - Board B - IMPORT TEST / STARTER schematic</text>
<text x="20" y="171" size="1.778" layer="97">Footprints are PLACEHOLDERS. Replace with verified SnapEDA/Ultra Librarian parts before layout. Netlist source of truth: hardware/board-b-ground-receiver.md</text>
</plain>
<instances>
<instance part="ANT1" gate="G$1" x="20" y="130"/>
<instance part="U1" gate="G$1" x="40" y="150"/>
<instance part="U2" gate="G$1" x="100" y="150"/>
<instance part="U3" gate="G$1" x="170" y="150"/>
<instance part="U4" gate="G$1" x="40" y="90"/>
<instance part="J1" gate="G$1" x="170" y="90"/>
<instance part="R1" gate="G$1" x="200" y="90"/>
<instance part="R2" gate="G$1" x="200" y="80"/>
</instances>
<busses/>
<nets>
<net name="RF_ANT" class="0">
<segment>
<wire x1="40" y1="127.14" x2="20" y2="130" width="0.1524" layer="91"/>
<pinref part="U1" gate="G$1" pin="ANT"/>
<pinref part="ANT1" gate="G$1" pin="SIG"/>
</segment>
</net>
<net name="LORA_NSS" class="0">
<segment>
<wire x1="100" y1="137.3" x2="40" y2="144.92" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="GP5_NSS"/>
<pinref part="U1" gate="G$1" pin="NSS"/>
</segment>
</net>
<net name="LORA_SCK" class="0">
<segment>
<wire x1="100" y1="144.92" x2="40" y2="142.38" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="GP2_SCK"/>
<pinref part="U1" gate="G$1" pin="SCK"/>
</segment>
</net>
<net name="LORA_MOSI" class="0">
<segment>
<wire x1="100" y1="142.38" x2="40" y2="139.84" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="GP3_MOSI"/>
<pinref part="U1" gate="G$1" pin="MOSI"/>
</segment>
</net>
<net name="LORA_MISO" class="0">
<segment>
<wire x1="100" y1="139.84" x2="40" y2="137.3" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="GP4_MISO"/>
<pinref part="U1" gate="G$1" pin="MISO"/>
</segment>
</net>
<net name="LORA_BUSY" class="0">
<segment>
<wire x1="100" y1="134.76" x2="40" y2="134.76" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="GP6_BUSY"/>
<pinref part="U1" gate="G$1" pin="BUSY"/>
</segment>
</net>
<net name="LORA_DIO1" class="0">
<segment>
<wire x1="100" y1="132.22" x2="40" y2="132.22" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="GP7_DIO1"/>
<pinref part="U1" gate="G$1" pin="DIO1"/>
</segment>
</net>
<net name="LORA_NRST" class="0">
<segment>
<wire x1="100" y1="129.68" x2="40" y2="129.68" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="GP8_NRST"/>
<pinref part="U1" gate="G$1" pin="NRST"/>
</segment>
</net>
<net name="QSPI_CS" class="0">
<segment>
<wire x1="100" y1="122.06" x2="170" y2="150" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="QSPI_CS"/>
<pinref part="U3" gate="G$1" pin="CS"/>
</segment>
</net>
<net name="QSPI_SCK" class="0">
<segment>
<wire x1="100" y1="119.52" x2="170" y2="137.3" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="QSPI_SCK"/>
<pinref part="U3" gate="G$1" pin="CLK"/>
</segment>
</net>
<net name="QSPI_SD0" class="0">
<segment>
<wire x1="100" y1="116.98" x2="170" y2="139.84" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="QSPI_SD0"/>
<pinref part="U3" gate="G$1" pin="DI"/>
</segment>
</net>
<net name="QSPI_SD1" class="0">
<segment>
<wire x1="100" y1="114.44" x2="170" y2="147.46" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="QSPI_SD1"/>
<pinref part="U3" gate="G$1" pin="DO"/>
</segment>
</net>
<net name="QSPI_SD2" class="0">
<segment>
<wire x1="100" y1="111.9" x2="170" y2="144.92" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="QSPI_SD2"/>
<pinref part="U3" gate="G$1" pin="WP"/>
</segment>
</net>
<net name="QSPI_SD3" class="0">
<segment>
<wire x1="100" y1="109.36" x2="170" y2="134.76" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="QSPI_SD3"/>
<pinref part="U3" gate="G$1" pin="HOLD"/>
</segment>
</net>
<net name="USB_DP" class="0">
<segment>
<wire x1="100" y1="127.14" x2="170" y2="84.92" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="USB_DP"/>
<pinref part="J1" gate="G$1" pin="DP"/>
</segment>
</net>
<net name="USB_DM" class="0">
<segment>
<wire x1="100" y1="124.6" x2="170" y2="82.38" width="0.1524" layer="91"/>
<pinref part="U2" gate="G$1" pin="USB_DM"/>
<pinref part="J1" gate="G$1" pin="DM"/>
</segment>
</net>
<net name="VBUS_5V" class="0">
<segment>
<wire x1="170" y1="90" x2="40" y2="90" width="0.1524" layer="91"/>
<pinref part="J1" gate="G$1" pin="VBUS"/>
<pinref part="U4" gate="G$1" pin="VIN"/>
</segment>
</net>
<net name="CC1" class="0">
<segment>
<wire x1="170" y1="79.84" x2="200" y2="90" width="0.1524" layer="91"/>
<pinref part="J1" gate="G$1" pin="CC1"/>
<pinref part="R1" gate="G$1" pin="1"/>
</segment>
</net>
<net name="CC2" class="0">
<segment>
<wire x1="170" y1="77.3" x2="200" y2="80" width="0.1524" layer="91"/>
<pinref part="J1" gate="G$1" pin="CC2"/>
<pinref part="R2" gate="G$1" pin="1"/>
</segment>
</net>
<net name="+3V3" class="0">
<segment>
<wire x1="40" y1="79.84" x2="100" y2="150" width="0.1524" layer="91"/>
<pinref part="U4" gate="G$1" pin="VOUT"/>
<pinref part="U2" gate="G$1" pin="IOVDD"/>
<pinref part="U1" gate="G$1" pin="VCC"/>
<pinref part="U3" gate="G$1" pin="VCC"/>
<label x="70" y="150" size="1.778" layer="95"/>
</segment>
</net>
<net name="GND" class="0">
<segment>
<wire x1="40" y1="87.46" x2="100" y2="147.46" width="0.1524" layer="91"/>
<pinref part="U4" gate="G$1" pin="GND"/>
<pinref part="U2" gate="G$1" pin="GND"/>
<pinref part="U1" gate="G$1" pin="GND"/>
<pinref part="U3" gate="G$1" pin="GND"/>
<pinref part="J1" gate="G$1" pin="GND"/>
<pinref part="R1" gate="G$1" pin="2"/>
<pinref part="R2" gate="G$1" pin="2"/>
<label x="70" y="147.46" size="1.778" layer="95"/>
</segment>
</net>
</nets>
</sheet>
</sheets>
</schematic>
</drawing>
</eagle>
