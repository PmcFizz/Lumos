/**
 * led灯开始寄存器索引
 */
export const ledRegisterStartAddress = 10;

/**
 *  寄存器0 - 【ID】（范围：1~255）[只能按键设置]
 *  寄存器1 - 【波特率】（范围：9600、19200、38400）[只能按键设置]
 *  寄存器2 - 【工作模式】（模式1、2、3）
 *  寄存器3 - 【DIM1灰度】（范围：0~255，与模式无关）
 *  寄存器4 - 【DIM2灰度】（范围：0~255，与模式无关）
 *  寄存器5 - 【DIM频率】（范围：1~5kHZ，与模式无关）
 *  寄存器6 - 【预留】
 *  寄存器7 - 【驱动板整体灰度】（范围：1~255，模式1专用）
 *  寄存器8 - 【寄存器有效位数】（范围：3~16，模式1专用）
 *  寄存器9 - 【驱动板输出路数】（范围：16~111*16）
 */

/**
 * 站号Id 寄存器索引
 */
export const modbusIdIndex = 0;

/**
 * 比特率 寄存器索引
 */
export const bitRateIndex = 1;

/**
 * 工作模式 寄存器索引
 */
export const workModeIndex = 2;

/**
 * 亮度 寄存器索引
 */
export const brightnessIndex = 7;

/**
 * 有效位数 寄存器索引
 */
export const effectiveBitIndex = 8;

/**
 * 输出路数 寄存器索引
 */
export const outCircuitsIndex = 9;

// [1, 96, 1, 255, 1, 2, 0, 255, 16, 20];
