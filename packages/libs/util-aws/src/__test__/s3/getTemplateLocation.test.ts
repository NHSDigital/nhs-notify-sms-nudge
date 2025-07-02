import { tidToTemplateS3Key, tidToImageS3Key } from '../../s3';

describe('s3Locations', () => {
  it('Returns template location', async () => {
    const result = tidToTemplateS3Key('templateId');

    expect(result).toEqual('templates/templateId/templateId_template.json');
  });

  it('Returns image location', async () => {
    const result = tidToImageS3Key('tid1', 'imagename');

    expect(result).toEqual('templates/tid1/images/imagename');
  });
});
